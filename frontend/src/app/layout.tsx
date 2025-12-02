import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Olympic Medal Insights",
  description: "DSCI 551 Project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex h-screen flex-col overflow-hidden`}>
        <Navbar />
        <main className="flex-1 overflow-y-auto pt-24 px-8 pb-8 bg-black text-white">
          {children}
        </main>
      </body>
    </html>
  );
}
