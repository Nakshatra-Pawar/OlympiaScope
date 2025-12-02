
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from my_sql_engine import (
    MyCSVParser,
    MyDataFrame,
    group_by_streaming_csv,
    medals_efficiency_for_year,
    medals_per_noc_year_streaming,
)

app = FastAPI(title="Olympic Medal Insights API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EVENTS_CSV = os.path.join(os.path.dirname(__file__), "events.csv")
COUNTRIES_CSV = os.path.join(os.path.dirname(__file__), "countries.csv")
CHUNK_SIZE = 50_000

# --- Helpers ---

def df_to_records(df: MyDataFrame) -> List[Dict[str, Any]]:
    """Convert MyDataFrame to list of dicts."""
    return list(df.iter_rows())

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/preview/events")
def get_events_preview(limit: int = 50):
    parser = MyCSVParser(EVENTS_CSV)
    rows = []
    for i, row in enumerate(parser.iter_rows()):
        if i >= limit:
            break
        rows.append(row)
    return rows

@app.get("/api/preview/countries")
def get_countries_preview(limit: int = 20):
    parser = MyCSVParser(COUNTRIES_CSV)
    rows = []
    for i, row in enumerate(parser.iter_rows()):
        if i >= limit:
            break
        rows.append(row)
    return rows

@app.get("/api/athletes/search")
def search_athletes(
    name: Optional[str] = Query(None),
    season: str = "All",
    year_min: int = 1896,
    year_max: int = 2016,
    noc: str = "All",
    sport: str = "All",
    medal_only: bool = True,
    page: int = 1,
    page_size: int = 50
):

    parser = MyCSVParser(EVENTS_CSV)
   
    from my_sql_engine import iter_filter_project_streaming
    
    name_lower = name.strip().lower() if name else ""
    
    def cond(row):
        if name_lower and name_lower not in (row.get("Name") or "").lower():
            return False
        if medal_only and row.get("Medal") is None:
            return False
        year = row.get("Year")
        if year is not None:
            if not (year_min <= year <= year_max):
                return False
        if season != "All" and row.get("Season") != season:
            return False
        if noc != "All" and row.get("NOC") != noc:
            return False
        if sport != "All" and row.get("Sport") != sport:
            return False
        return True

   
    filtered_rows = list(iter_filter_project_streaming(parser, cond_func=cond))
    
    filtered_rows.sort(key=lambda x: x.get("Year") or 0)
    
    total = len(filtered_rows)
    start = (page - 1) * page_size
    end = start + page_size
    data = filtered_rows[start:end]
    
    return {
        "data": data,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@app.get("/api/sports")
def get_sports():
    parser = MyCSVParser(EVENTS_CSV)
    sports = set()
    for row in parser.iter_rows():
        s = row.get("Sport")
        if s:
            sports.add(s)
    return sorted(list(sports))

@app.get("/api/leaderboard")
def get_leaderboard(year: Optional[int] = None, top_n: int = 20):
    c_parser = MyCSVParser(COUNTRIES_CSV)
    countries = MyDataFrame.from_rows(c_parser.iter_rows())
    
    if year is None:
        df_counts = group_by_streaming_csv(
            EVENTS_CSV,
            keys=["NOC"],
            agg_spec={"Medal": "count_col"},
            sep=",",
            chunk_size=CHUNK_SIZE,
        )
        joined = df_counts.join(
            countries,
            on_key="NOC",
            how="left",
            suffixes=("_counts", "_country"),
        )
        joined_sorted = joined.order_by([("count_Medal", "desc")])
        result = joined_sorted.head(top_n)
    else:
        # Specific year
        noc_year_df = medals_per_noc_year_streaming(
            events_csv=EVENTS_CSV,
            chunk_size=CHUNK_SIZE,
            season=None,
            medal_filter=None,
        )
        df_year = noc_year_df.filter(lambda r: r["Year"] == year)
        joined = df_year.join(
            countries,
            on_key="NOC",
            how="left",
            suffixes=("_counts", "_country"),
        )
        joined_sorted = joined.order_by([("medal_count", "desc")])
        result = joined_sorted.head(top_n)
        
    return df_to_records(result)

@app.get("/api/efficiency")
def get_efficiency(
    year: int,
    season: str = "All",
    medal: str = "All",
    sort_by: str = "Medals per million people",
    top_n: int = 20
):
    season_arg = None if season == "All" else season
    medal_arg = None if medal == "All" else medal
    
    df_eff = medals_efficiency_for_year(
        year=year,
        season=season_arg,
        medal_filter=medal_arg,
    )
    
    if sort_by == "Total medals":
        df_eff = df_eff.order_by([("medal_count", "desc")])
    elif sort_by == "Medals per billion GDP":
        df_eff = df_eff.order_by([("medals_per_billion_gdp", "desc")])
    else:
        # Default: Medals per million people
        df_eff = df_eff.order_by([("medals_per_million", "desc")])
        
    display_cols = [
        "NOC", "region", "Country Code", "Country Name", "Year",
        "medal_count", "Population", "GDP_USD",
        "medals_per_million", "medals_per_billion_gdp"
    ]
    # Filter cols that exist
    existing_cols = df_eff.columns()
    final_cols = [c for c in display_cols if c in existing_cols]
    
    df_display = df_eff.project(final_cols).head(top_n)
    return df_to_records(df_display)

@app.get("/api/join-demo")
def get_join_demo(limit: int = 100):
    e_parser = MyCSVParser(EVENTS_CSV)
    events_rows = []
    for i, row in enumerate(e_parser.iter_rows()):
        if i >= 5000:
            break
        events_rows.append(row)
    events_sample = MyDataFrame.from_rows(events_rows)
    
    c_parser = MyCSVParser(COUNTRIES_CSV)
    countries = MyDataFrame.from_rows(c_parser.iter_rows())
    
    joined = events_sample.join(
        countries, on_key="NOC", how="left", suffixes=("_event", "_country")
    )
    
    joined_projected = joined.project(
        ["Name", "Year", "Season", "Sport", "Event", "Medal", "NOC", "region"]
    )
    
    return df_to_records(joined_projected.head(limit))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
