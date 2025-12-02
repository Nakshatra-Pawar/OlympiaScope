const API_BASE_URL = "http://localhost:8000/api";

export async function fetchEventsPreview(limit: number = 50) {
    const res = await fetch(`${API_BASE_URL}/preview/events?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch events preview");
    return res.json();
}

export async function fetchCountriesPreview(limit: number = 20) {
    const res = await fetch(`${API_BASE_URL}/preview/countries?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch countries preview");
    return res.json();
}

export async function searchAthletes(params: {
    name?: string;
    season?: string;
    year_min?: number;
    year_max?: number;
    noc?: string;
    sport?: string;
    medal_only?: boolean;
    page?: number;
    page_size?: number;
}) {
    const searchParams = new URLSearchParams();
    if (params.name) searchParams.append("name", params.name);
    if (params.season) searchParams.append("season", params.season);
    if (params.year_min) searchParams.append("year_min", params.year_min.toString());
    if (params.year_max) searchParams.append("year_max", params.year_max.toString());
    if (params.noc) searchParams.append("noc", params.noc);
    if (params.sport) searchParams.append("sport", params.sport);
    if (params.medal_only !== undefined) searchParams.append("medal_only", params.medal_only.toString());
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.page_size) searchParams.append("page_size", params.page_size.toString());

    const res = await fetch(`${API_BASE_URL}/athletes/search?${searchParams.toString()}`);
    if (!res.ok) throw new Error("Failed to search athletes");
    return res.json();
}

export async function fetchSports() {
    const res = await fetch(`${API_BASE_URL}/sports`);
    if (!res.ok) throw new Error("Failed to fetch sports");
    return res.json();
}

export async function fetchLeaderboard(year?: number | string, top_n: number = 20) {
    let url = `${API_BASE_URL}/leaderboard?top_n=${top_n}`;
    if (year && year !== "All years") {
        url += `&year=${year}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return res.json();
}

export async function fetchEfficiency(params: any) {
    const searchParams = new URLSearchParams(params);
    const res = await fetch(`${API_BASE_URL}/efficiency?${searchParams.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch efficiency data");
    return res.json();
}

export async function fetchJoinDemo(limit: number = 100) {
    const res = await fetch(`${API_BASE_URL}/join-demo?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch join demo data");
    return res.json();
}
