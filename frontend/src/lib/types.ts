
export interface EventRow {
    ID: string;
    Name: string;
    Sex: string;
    Age: string;
    Height: string;
    Weight: string;
    Team: string;
    NOC: string;
    Games: string;
    Year: string | number;
    Season: string;
    City: string;
    Sport: string;
    Event: string;
    Medal: string | null;
}

export interface CountryRow {
    NOC: string;
    region: string;
    notes?: string;
}

export interface LeaderboardRow {
    NOC: string;
    region: string;
    count_Medal?: number;
    medal_count?: number;
    Year?: number;
    Medals?: number;
}

export interface EfficiencyRow {
    NOC: string;
    region: string;
    "Country Name": string;
    Year: number;
    medal_count: number;
    Population: number;
    GDP_USD: number;
    medals_per_million: number;
    medals_per_billion_gdp: number;
}

export interface JoinDemoRow extends EventRow {
    region: string;
}
