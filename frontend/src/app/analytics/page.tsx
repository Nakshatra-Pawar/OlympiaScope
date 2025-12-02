
"use client";

import { useState, useEffect } from "react";
import { fetchEfficiency } from "@/lib/api";
import { EfficiencyRow } from "@/lib/types";
import { DataTable } from "@/components/ui/DataTable";
import { BackendOperations } from "@/components/BackendOperations";
import { GlassCard } from "@/components/ui/GlassCard";
import { OlympicRings } from "@/components/ui/OlympicRings";

export default function EfficiencyPage() {
    const [year, setYear] = useState(2012);
    const [season, setSeason] = useState("All");
    const [medal, setMedal] = useState("All");
    const [sortBy, setSortBy] = useState("Medals per million people");
    const [topN, setTopN] = useState(20);

    const [data, setData] = useState<EfficiencyRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetchEfficiency({
                    year,
                    season,
                    medal,
                    sort_by: sortBy,
                    top_n: topN,
                });
                setData(res);
            } catch (err) {
                console.error(err);
                setError("Failed to load efficiency data");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [year, season, medal, sortBy, topN]);

    return (
        <div className="space-y-6 relative">
            <OlympicRings />
            <div>
                <h1 className="text-2xl font-bold mb-2 text-white">Medal Efficiency</h1>
                <p className="text-gray-400">
                    Analyze how efficient countries are at converting population and GDP into Olympic medals.
                </p>
            </div>

            <GlassCard className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Year</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="1960"
                                max="2016"
                                step="1"
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                            />
                            <span className="text-sm font-bold w-12 text-gold">{year}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Season</label>
                        <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                            value={season}
                            onChange={(e) => setSeason(e.target.value)}
                        >
                            <option value="All">All Seasons</option>
                            <option value="Summer">Summer</option>
                            <option value="Winter">Winter</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Medal Type</label>
                        <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                            value={medal}
                            onChange={(e) => setMedal(e.target.value)}
                        >
                            <option value="All">All Medals</option>
                            <option value="Gold">Gold</option>
                            <option value="Silver">Silver</option>
                            <option value="Bronze">Bronze</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Sort By</label>
                        <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="Medals per million people">Medals per million people</option>
                            <option value="Medals per billion GDP">Medals per billion GDP</option>
                            <option value="Total medals">Total medals</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Show top {topN} countries</label>
                        <input
                            type="range"
                            min="5"
                            max="50"
                            step="1"
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                            value={topN}
                            onChange={(e) => setTopN(Number(e.target.value))}
                        />
                        <div className="text-right text-sm text-gold font-bold">{topN}</div>
                    </div>
                </div>
            </GlassCard>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-400">Loading efficiency metrics...</div>
                ) : error ? (
                    <div className="text-center py-8 text-red-400 bg-red-900/20 rounded-lg border border-red-900/50">{error}</div>
                ) : (
                    <DataTable
                        data={data}
                        columns={[
                            "NOC",
                            "region",
                            "Country Name",
                            "Year",
                            "medal_count",
                            "Population",
                            "GDP_USD",
                            "medals_per_million",
                            "medals_per_billion_gdp",
                        ]}
                    />
                )}
            </div>

            <BackendOperations
                items={[
                    {
                        title: "Efficiency Calculation",
                        description: "Computes medals per capita/GDP.",
                        code: "medals_efficiency_for_year()",
                    },
                    {
                        title: "Data Loading",
                        description: "Parses multiple CSVs (events, countries, stats).",
                        code: "MyCSVParser.iter_rows()",
                    },
                    {
                        title: "Column Derivation",
                        description: "Adds new columns for calculated metrics.",
                        code: "MyDataFrame.add_column()",
                    },
                ]}
            />
        </div>
    );
}
