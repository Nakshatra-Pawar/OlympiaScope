
"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import clsx from "clsx";

interface BackendOperationsProps {
    items: {
        title: string;
        description: string;
        code?: string;
    }[];
}

export function BackendOperations({ items }: BackendOperationsProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-black dark:bg-white text-white dark:text-black p-3 rounded-full shadow-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all z-50"
                title="Show Backend Operations"
            >
                <Info className="h-6 w-6" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Backend Operations
                </h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="p-4 overflow-y-auto text-sm space-y-4">
                {items.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                            {item.title}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {item.description}{" "}
                            {item.code && (
                                <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono text-pink-600 dark:text-pink-400">
                                    {item.code}
                                </code>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
