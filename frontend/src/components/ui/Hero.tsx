"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function Hero() {
    return (
        <section className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden mt-16">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/hero-bg.png"
                    alt="Olympic Stadium Abstract"
                    fill
                    className="object-cover opacity-40"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center space-y-2 max-w-5xl px-4 flex flex-col items-center justify-center h-full">
                {/* Olympic Rings Behind Text */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 0.25, scale: 1 }}
                    transition={{ duration: 1.5 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[600px] h-[300px]"
                >
                    <div className="relative w-full h-full">
                        {/* Blue */}
                        <div className="absolute top-0 left-0 w-40 h-40 border-[12px] border-olympic-blue rounded-full" />
                        {/* Yellow */}
                        <div className="absolute top-16 left-20 w-40 h-40 border-[12px] border-olympic-yellow rounded-full" />
                        {/* Black (White in dark mode for visibility, or kept dark if intended to be subtle) - User asked for "Olympic ring picture", usually implies colors. Since it's dark mode, "Black" ring might be invisible. Let's make it White or a dark grey if it needs to be the "Black" ring, but usually on dark backgrounds it's white. Let's stick to standard colors but maybe adjust opacity or blending. The user said "behind the title". */}
                        <div className="absolute top-0 left-40 w-40 h-40 border-[12px] border-white rounded-full" />
                        {/* Green */}
                        <div className="absolute top-16 left-60 w-40 h-40 border-[12px] border-olympic-green rounded-full" />
                        {/* Red */}
                        <div className="absolute top-0 left-80 w-40 h-40 border-[12px] border-olympic-red rounded-full" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white mb-2 drop-shadow-2xl relative">
                        OLYMPIA<span className="text-gradient-gold">SCOPE</span>
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xl md:text-2xl text-gray-200 font-medium tracking-wide max-w-2xl mx-auto"
                >
                    Unveiling the <span className="text-white font-bold">Data</span> Behind the <span className="text-gold font-bold">Glory</span>
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="pt-8"
                >
                    <div className="flex justify-center gap-4">
                        <div className="h-1.5 w-16 bg-olympic-blue rounded-full shadow-lg shadow-olympic-blue/50" />
                        <div className="h-1.5 w-16 bg-olympic-yellow rounded-full shadow-lg shadow-olympic-yellow/50" />
                        <div className="h-1.5 w-16 bg-white rounded-full shadow-lg shadow-white/50" />
                        <div className="h-1.5 w-16 bg-olympic-green rounded-full shadow-lg shadow-olympic-green/50" />
                        <div className="h-1.5 w-16 bg-olympic-red rounded-full shadow-lg shadow-olympic-red/50" />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
