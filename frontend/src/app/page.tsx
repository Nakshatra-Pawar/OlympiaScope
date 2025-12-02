"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { fetchEventsPreview, fetchCountriesPreview } from "@/lib/api";
import { EventRow, CountryRow } from "@/lib/types";
import { DataTable } from "@/components/ui/DataTable";
import { BackendOperations } from "@/components/BackendOperations";
import { Hero } from "@/components/ui/Hero";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [previewOpen, setPreviewOpen] = useState(true);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [countriesOpen, setCountriesOpen] = useState(false);
  const [rowCount, setRowCount] = useState(10);

  const [events, setEvents] = useState<EventRow[]>([]);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data when preview is opened or row count changes
  useEffect(() => {
    if (!previewOpen) return;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [eventsData, countriesData] = await Promise.all([
          fetchEventsPreview(rowCount),
          fetchCountriesPreview(rowCount),
        ]);
        setEvents(eventsData);
        setCountries(countriesData);
      } catch (err) {
        setError("Failed to load preview data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    // Debounce slightly to avoid too many requests if typing row count
    const timeoutId = setTimeout(() => {
      loadData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [previewOpen, rowCount]);

  return (
    <div className="flex flex-col items-center w-full">
      <Hero />

      <div className="w-full max-w-7xl px-4 py-12 space-y-12 relative z-10 mt-8">
        {/* Collapsible Data Preview Section */}
        <GlassCard className="w-full bg-white/10 border-white/20">
          <div
            className="flex items-center justify-between cursor-pointer group"
            onClick={() => setPreviewOpen(!previewOpen)}
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                {previewOpen ? (
                  <ChevronDown className="h-6 w-6 text-gold" />
                ) : (
                  <ChevronRight className="h-6 w-6 text-gold" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Data Preview</h2>
                <p className="text-gray-400 text-sm">Explore the raw Olympic dataset</p>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {previewOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-6 space-y-8">
                  {/* Row Count Control */}
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <label className="text-sm font-medium text-gray-300">Rows to preview:</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={rowCount}
                      onChange={(e) => setRowCount(Number(e.target.value))}
                      className="w-24 px-3 py-2 bg-black/50 border border-white/20 rounded-md text-white focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  {loading && (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                    </div>
                  )}

                  {error && <div className="p-4 text-red-400 bg-red-900/20 rounded-lg border border-red-900/50">{error}</div>}

                  {!loading && !error && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Events Sub-tab */}
                      <div className="space-y-4">
                        <div
                          className="flex items-center gap-2 cursor-pointer p-3 hover:bg-white/5 rounded-lg transition-colors"
                          onClick={() => setEventsOpen(!eventsOpen)}
                        >
                          {eventsOpen ? (
                            <ChevronDown className="h-5 w-5 text-gold" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gold" />
                          )}
                          <h3 className="font-bold text-lg text-white">Events Data</h3>
                        </div>
                        <AnimatePresence>
                          {eventsOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                            >
                              <DataTable data={events} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Countries Sub-tab */}
                      <div className="space-y-4">
                        <div
                          className="flex items-center gap-2 cursor-pointer p-3 hover:bg-white/5 rounded-lg transition-colors"
                          onClick={() => setCountriesOpen(!countriesOpen)}
                        >
                          {countriesOpen ? (
                            <ChevronDown className="h-5 w-5 text-gold" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gold" />
                          )}
                          <h3 className="font-bold text-lg text-white">Countries Data</h3>
                        </div>
                        <AnimatePresence>
                          {countriesOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                            >
                              <DataTable data={countries} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        <BackendOperations
          items={[
            {
              title: "Data Loading",
              description: "Fetches preview data from CSV files.",
              code: "MyCSVParser.iter_rows()",
            },
            {
              title: "Pagination",
              description: "Limits rows read from disk for performance.",
              code: "itertools.islice()",
            },
          ]}
        />
      </div>
    </div>
  );
}
