
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DataTableProps<T> {
    data: T[];
    columns?: (keyof T)[];
    className?: string;
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    className,
}: DataTableProps<T>) {
    if (!data || data.length === 0) {
        return (
            <div className="text-gray-400 p-8 text-center border border-dashed border-gray-700 rounded-xl bg-white/5">
                No data available.
            </div>
        );
    }

    const headers = columns || (Object.keys(data[0]) as (keyof T)[]);

    return (
        <div className={cn("glass rounded-xl overflow-hidden", className)}>
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                            {headers.map((key) => (
                                <th
                                    key={String(key)}
                                    className="h-12 px-6 text-left align-middle font-semibold text-gold uppercase tracking-wider text-xs whitespace-nowrap"
                                >
                                    {String(key)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.map((row, i) => (
                            <motion.tr
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.3 }}
                                key={i}
                                className="transition-colors hover:bg-white/5"
                            >
                                {headers.map((key) => (
                                    <td
                                        key={String(key)}
                                        className="p-4 px-6 align-middle whitespace-nowrap text-gray-300"
                                    >
                                        {row[key] === null ? (
                                            <span className="text-gray-600 italic">NA</span>
                                        ) : (
                                            String(row[key])
                                        )}
                                    </td>
                                ))}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
