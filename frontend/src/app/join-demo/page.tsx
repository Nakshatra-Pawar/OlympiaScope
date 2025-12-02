
"use client";

import { useState, useEffect } from "react";
import { fetchJoinDemo } from "@/lib/api";
import { JoinDemoRow } from "@/lib/types";
import { DataTable } from "@/components/ui/DataTable";
import { BackendOperations } from "@/components/BackendOperations";

export default function JoinDemoPage() {
    const [data, setData] = useState<JoinDemoRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const res = await fetchJoinDemo(100);
                setData(res);
            } catch (err) {
                console.error(err);
                setError("Failed to load join demo data");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-2">Join Demo</h1>
                <p className="text-gray-500">
                    Sample events joined with country information (Region).
                </p>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading join demo...</div>
                ) : error ? (
                    <div className="text-center py-8 text-red-500">{error}</div>
                ) : (
                    <DataTable
                        data={data}
                        columns={[
                            "Name",
                            "Year",
                            "Season",
                            "Sport",
                            "Event",
                            "Medal",
                            "NOC",
                            "region",
                        ]}
                    />
                )}
            </div>

            <BackendOperations
                items={[
                    {
                        title: "Data Loading",
                        description: "Parses events and countries using custom parser.",
                        code: "MyCSVParser.iter_rows()",
                    },
                    {
                        title: "Join Algorithm",
                        description: "Performs hash join on NOC column.",
                        code: "MyDataFrame.join()",
                    },
                    {
                        title: "Projection",
                        description: "Selects specific columns from joined result.",
                        code: "MyDataFrame.project()",
                    },
                ]}
            />
        </div>
    );
}
