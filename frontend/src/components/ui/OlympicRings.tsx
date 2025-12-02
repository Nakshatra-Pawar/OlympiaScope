"use client";

export function OlympicRings() {
    return (
        <div
            className="absolute top-32 left-1/2 -translate-x-1/2 w-[500px] h-[250px] pointer-events-none opacity-20"
            style={{ zIndex: 0 }}
        >
            <div className="relative w-full h-full">
                {/* Blue */}
                <div className="absolute top-0 left-0 w-32 h-32 border-[10px] border-olympic-blue rounded-full" />
                {/* Yellow */}
                <div className="absolute top-12 left-16 w-32 h-32 border-[10px] border-olympic-yellow rounded-full" />
                {/* Black (White in dark mode for visibility) */}
                <div className="absolute top-0 left-32 w-32 h-32 border-[10px] border-white rounded-full" />
                {/* Green */}
                <div className="absolute top-12 left-48 w-32 h-32 border-[10px] border-olympic-green rounded-full" />
                {/* Red */}
                <div className="absolute top-0 left-64 w-32 h-32 border-[10px] border-olympic-red rounded-full" />
            </div>
        </div>
    );
}
