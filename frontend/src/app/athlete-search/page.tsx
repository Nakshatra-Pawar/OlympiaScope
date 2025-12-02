"use client";

import { useState, useEffect } from "react";
import { searchAthletes, fetchCountriesPreview, fetchSports } from "@/lib/api";
import { EventRow } from "@/lib/types";
import { DataTable } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { Search } from "lucide-react";
import { BackendOperations } from "@/components/BackendOperations";
import { GlassCard } from "@/components/ui/GlassCard";
import { OlympicRings } from "@/components/ui/OlympicRings";

export default function AthleteSearchPage() {
    const [name, setName] = useState("");
    const [season, setSeason] = useState("All");
    const [yearMin, setYearMin] = useState(1896);
    const [yearMax, setYearMax] = useState(2016);
    const [noc, setNoc] = useState("All");
    const [sport, setSport] = useState("All");
    const [medalOnly, setMedalOnly] = useState(true);
    const [page, setPage] = useState(1);

    const [results, setResults] = useState<EventRow[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [nocOptions, setNocOptions] = useState<string[]>([]);
    const [sportOptions, setSportOptions] = useState<string[]>([]);

    // Load NOCs and Sports on mount
    useEffect(() => {
        Promise.all([
            fetchCountriesPreview(300),
            fetchSports()
        ]).then(([countriesData, sportsData]) => {
            const nocs = countriesData.map((c: any) => c.NOC).sort();
            setNocOptions(["All", ...nocs]);
            setSportOptions(["All", ...sportsData]);
        });
    }, []);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await searchAthletes({
                name,
                season,
                year_min: yearMin,
                year_max: yearMax,
                noc,
                sport,
                medal_only: medalOnly,
                page,
                page_size: 50,
            });
            setResults(res.data);
            setTotal(res.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Trigger search when page changes
    useEffect(() => {
        // Only auto-search if we have some criteria or if user explicitly clicked search before
        // For now let's just search if name is present OR if it's a page change after initial search
        // But actually, we want to support empty name search now.
        handleSearch();
    }, [page]);

    return (
        <div className="space-y-6 relative">
            <OlympicRings />
            <div>
                <h1 className="text-2xl font-bold mb-2">Athlete Search</h1>
                <p className="text-gray-500">Search for athletes and their results.</p>
            </div>

            <GlassCard className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Athlete Name</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="e.g. Phelps"
                                className="w-full pl-9 h-10 rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold/50"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
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
                        <label className="text-sm font-medium text-gray-300">Year Range</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                                value={yearMin}
                                onChange={(e) => setYearMin(Number(e.target.value))}
                                min={1896}
                                max={2016}
                            />
                            <span className="text-gray-500">-</span>
                            <input
                                type="number"
                                className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                                value={yearMax}
                                onChange={(e) => setYearMax(Number(e.target.value))}
                                min={1896}
                                max={2016}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Country (NOC)</label>
                        <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                            value={noc}
                            onChange={(e) => setNoc(e.target.value)}
                        >
                            {nocOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Sport</label>
                        <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                            value={sport}
                            onChange={(e) => setSport(e.target.value)}
                        >
                            {sportOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 cursor-pointer hover:text-white transition-colors">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-600 bg-black/50 text-gold focus:ring-gold"
                            checked={medalOnly}
                            onChange={(e) => setMedalOnly(e.target.checked)}
                        />
                        <span>Show only rows with medals</span>
                    </label>

                    <button
                        onClick={() => {
                            setPage(1);
                            handleSearch();
                        }}
                        className="inline-flex items-center justify-center rounded-full text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gold text-black hover:bg-yellow-400 hover:scale-105 h-10 px-8 shadow-lg shadow-gold/20"
                    >
                        Search Athletes
                    </button>
                </div>
            </GlassCard>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Searching...</div>
                ) : (
                    <>
                        <div className="text-sm text-gray-500">
                            Found {total} results
                        </div>
                        <DataTable
                            data={results}
                            columns={[
                                "Name",
                                "Sex",
                                "Age",
                                "Team",
                                "NOC",
                                "Year",
                                "Season",
                                "City",
                                "Sport",
                                "Event",
                                "Medal",
                            ]}
                        />
                        {total > 50 && (
                            <Pagination
                                currentPage={page}
                                totalPages={Math.ceil(total / 50)}
                                onPageChange={setPage}
                            />
                        )}
                    </>
                )}
            </div>

            <BackendOperations
                items={[
                    {
                        title: "Streaming Filter",
                        description: "Iterates and filters rows without loading full dataset.",
                        code: "iter_filter_project_streaming()",
                    },
                    {
                        title: "Underlying Parser",
                        description: "Reads CSV rows on demand.",
                        code: "MyCSVParser.iter_rows()",
                    },
                    {
                        title: "Predicate Pushdown",
                        description: "Applies conditions (Name, Year, Sport) inside the loop.",
                    },
                ]}
            />
        </div>
    );
}
