"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = true }: GlassCardProps) {
    return (
        <div
            className={cn(
                "glass rounded-2xl p-6 transition-all duration-300",
                hoverEffect && "glass-hover hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10",
                className
            )}
        >
            {children}
        </div>
    );
}
