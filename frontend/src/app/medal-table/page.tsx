
"use client";

import { useState, useEffect } from "react";
import { fetchLeaderboard } from "@/lib/api";
import { LeaderboardRow } from "@/lib/types";
import { DataTable } from "@/components/ui/DataTable";
import { BackendOperations } from "@/components/BackendOperations";
import { GlassCard } from "@/components/ui/GlassCard";
import { OlympicRings } from "@/components/ui/OlympicRings";

export default function LeaderboardPage() {
    const [year, setYear] = useState<string | number>("All years");
    const [topN, setTopN] = useState(20);
    const [data, setData] = useState<LeaderboardRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const years = ["All years", ...Array.from({ length: 2016 - 1896 + 1 }, (_, i) => 1896 + i)];

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetchLeaderboard(year, topN);
                // Normalize data
                const normalizedData = res.map((row: LeaderboardRow) => ({
                    ...row,
                    Medals: row.medal_count ?? row.count_Medal ?? 0,
                    Year: row.Year ?? "All Time",
                }));
                setData(normalizedData);
            } catch (err) {
                console.error(err);
                setError("Failed to load leaderboard data");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [year, topN]);

    return (
        <div className="space-y-6 relative">
            <OlympicRings />
            <div>
                <h1 className="text-2xl font-bold mb-2 text-white">Country Medal Leaderboard</h1>
                <p className="text-gray-400">
                    Total medals by country (with optional year filter).
                </p>
            </div>

            <GlassCard className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Year</label>
                        <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                            value={year}
                            onChange={(e) => setYear(e.target.value === "All years" ? "All years" : Number(e.target.value))}
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
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
                    <div className="text-center py-8 text-gray-400">Loading leaderboard...</div>
                ) : error ? (
                    <div className="text-center py-8 text-red-400 bg-red-900/20 rounded-lg border border-red-900/50">{error}</div>
                ) : (
                    <DataTable
                        data={data}
                        columns={["NOC", "region", "Year", "Medals"]}
                    />
                )}
            </div>

            <BackendOperations
                items={[
                    {
                        title: "Streaming Aggregation",
                        description: "Counts medals by NOC in a single pass.",
                        code: "group_by_streaming_csv()",
                    },
                    {
                        title: "CSV Parsing",
                        description: "Reads events.csv line-by-line for aggregation.",
                        code: "MyCSVParser.iter_rows()",
                    },
                    {
                        title: "Join Operation",
                        description: "Merges counts with country data.",
                        code: "MyDataFrame.join()",
                    },
                ]}
            />
        </div>
    );
}
