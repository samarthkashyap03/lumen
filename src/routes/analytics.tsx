import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Eye, Smartphone, Clock, Award, Users, BookOpen } from "lucide-react";
import { API_URL } from "@/lib/config";
import { auth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Reader Analytics — Lumen" },
      { name: "description", content: "Engagement metrics and swipe statistics." },
    ],
  }),
  component: AnalyticsPage,
});

type AnalyticsData = {
  total_users: number;
  total_articles: number;
  total_views: number;
  total_swipes: number;
  total_reads: number;
  dwell_time_avg: number;
  swipe_rate_by_day: { day: string; swipes: number; reads: number }[];
  category_distribution: { name: string; value: number }[];
};

const DEFAULT_ANALYTICS: AnalyticsData = {
  total_users: 0,
  total_articles: 0,
  total_views: 0,
  total_swipes: 0,
  total_reads: 0,
  dwell_time_avg: 0,
  swipe_rate_by_day: [
    { day: "Mon", swipes: 0, reads: 0 },
    { day: "Tue", swipes: 0, reads: 0 },
    { day: "Wed", swipes: 0, reads: 0 },
    { day: "Thu", swipes: 0, reads: 0 },
    { day: "Fri", swipes: 0, reads: 0 },
    { day: "Sat", swipes: 0, reads: 0 },
    { day: "Sun", swipes: 0, reads: 0 }
  ],
  category_distribution: []
};

const PIE_COLORS = ["#e85d3a", "#2d2826", "#f5f1e8", "#1a1816"];

function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(DEFAULT_ANALYTICS);
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Route guard: check editor role
  useEffect(() => {
    setMounted(true);
    const s = auth.getSession();
    setSession(s);
    if (!s || s.role !== "editor") {
      toast.error("Access restricted to Editors.");
      navigate({ to: "/login" });
    }
  }, []);

  useEffect(() => {
    if (mounted && session && session.role === "editor") {
      fetch(`${API_URL}/api/analytics/summary`)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((summary) => {
          setData(summary);
        })
        .catch(() => {
          // Fallback mockup
          setData(DEFAULT_ANALYTICS);
        });
    }
  }, [mounted, session]);

  if (!mounted || !session || session.role !== "editor") {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col justify-between">
      <div className="grain-overlay" />
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto w-full">
        
        {/* Editorial layout header */}
        <section className="border-b border-line pb-8 mb-16">
          <p className="text-ember font-medium tracking-[0.25em] uppercase text-xs mb-4">
            System activity
          </p>
          <h1 className="font-serif leading-[0.95] text-5xl md:text-7xl">
            Reader <span className="italic text-ember">Pulse.</span>
          </h1>
          <p className="mt-4 text-sm text-foreground/50">
            Real-time visual reports computed from your actual article and user data.
        </p>
        </section>

        {/* High-level Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-16">
          {[
            { label: "Registered Users", val: data.total_users, icon: Users },
            { label: "Published Articles", val: data.total_articles, icon: BookOpen },
            { label: "Total Views", val: data.total_views, icon: Eye },
            { label: "Total Swipes", val: data.total_swipes, icon: Smartphone },
            { label: "Long-form Reads", val: data.total_reads, icon: Award },
            { label: "Avg Dwell Time", val: `${data.dwell_time_avg}s`, icon: Clock }
          ].map((m, idx) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="border border-line bg-card/10 p-6 flex flex-col justify-between h-36"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/45 font-medium">{m.label}</span>
                <m.icon className="h-4 w-4 text-ember" />
              </div>
              <div className="font-serif text-4xl md:text-5xl font-light mt-auto">
                {m.val}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Daily swipe activity chart */}
          <div className="lg:col-span-8 border border-line bg-card/10 p-8 rounded-lg flex flex-col justify-between min-h-[400px]">
            <h3 className="font-serif text-2xl text-foreground mb-6">Interaction Rhythms</h3>
            <div className="flex-1 w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.swipe_rate_by_day} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="day" 
                    stroke="var(--line)" 
                    tick={{ fill: "rgba(245, 241, 232, 0.4)", fontSize: 10, letterSpacing: "0.1em" }} 
                  />
                  <YAxis 
                    stroke="var(--line)" 
                    tick={{ fill: "rgba(245, 241, 232, 0.4)", fontSize: 10 }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--ink)", borderColor: "var(--line)" }} 
                    labelStyle={{ color: "var(--ember)", fontFamily: "Instrument Serif", fontStyle: "italic" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="swipes" 
                    stroke="#e85d3a" 
                    strokeWidth={2.5} 
                    dot={{ fill: "#e85d3a", strokeWidth: 0, r: 4 }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="reads" 
                    stroke="#f5f1e8" 
                    strokeWidth={1.5} 
                    dot={{ fill: "#f5f1e8", strokeWidth: 0, r: 3 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 mt-6 border-t border-line/40 pt-4 text-[10px] uppercase tracking-[0.2em] text-foreground/40">
              <span className="flex items-center gap-2">
                <span className="h-2 w-4 bg-ember inline-block" /> Swipes
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-4 bg-foreground/60 inline-block" /> Reads
              </span>
            </div>
          </div>

          {/* Category distribution pie-chart */}
          <div className="lg:col-span-4 border border-line bg-card/10 p-8 rounded-lg flex flex-col justify-between min-h-[400px]">
            <h3 className="font-serif text-2xl text-foreground mb-6">Topic Dispersal</h3>
            <div className="flex-1 w-full h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.category_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.category_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--ink)", borderColor: "var(--line)" }}
                    itemStyle={{ color: "var(--foreground)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6 border-t border-line/40 pt-4">
              {data.category_distribution.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                  <span 
                    className="h-2 w-2 rounded-full inline-block" 
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} 
                  />
                  <span className="text-foreground/60">{entry.name}</span>
                  <span className="font-medium text-foreground ml-auto">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
