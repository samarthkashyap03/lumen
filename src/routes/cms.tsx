import { createFileRoute, Link, useNavigate, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import {
  Plus,
  Check,
  RefreshCw,
  AlertCircle,
  Link2,
  FileText,
  ArrowRight,
  Star,
  Share2,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";

export const Route = createFileRoute("/cms")({
  head: () => ({
    meta: [
      { title: "Curation Dashboard — Lumen" },
      {
        name: "description",
        content: "Submit URLs and compose dispatches for the multi-agent pipeline.",
      },
    ],
  }),
  component: CmsPage,
});

type IngestionJob = {
  id: string;
  url: string;
  title: string;
  category: string;
  status: "processing" | "completed" | "failed";
  created_at: string;
};

// Available pipeline agents to visualize
const AGENT_STEPS = [
  "Agent 1: Analyze text",
  "Extract RAG vector chunks",
  "Agent 2: Generate cards",
  "Agent 3: Copywrite & Style",
  "Publishing dispatch",
];

const getEditorStats = (completedCount: number) => {
  let stars = 0;
  let title = "Novice Writer";
  let encouragement = "";

  if (completedCount < 3) {
    stars = 0;
    title = "Novice Writer";
    const diff = 3 - completedCount;
    encouragement = `Publish ${diff} more dispatch${diff !== 1 ? "es" : ""} to reach Apprentice Essayist and earn your 1st star.`;
  } else if (completedCount < 5) {
    stars = 1;
    title = "Apprentice Essayist";
    const diff = 5 - completedCount;
    encouragement = `Publish ${diff} more dispatch${diff !== 1 ? "es" : ""} to reach Editorial Sage and earn your 2nd star.`;
  } else if (completedCount < 10) {
    stars = 2;
    title = "Editorial Sage";
    const diff = 10 - completedCount;
    encouragement = `Publish ${diff} more dispatch${diff !== 1 ? "es" : ""} to reach Master Scribe and earn your 3rd star.`;
  } else if (completedCount < 15) {
    stars = 3;
    title = "Master Scribe";
    const diff = 15 - completedCount;
    encouragement = `Publish ${diff} more dispatch${diff !== 1 ? "es" : ""} to reach Grand Archivist and earn your 4th star.`;
  } else if (completedCount === 15) {
    stars = 4;
    title = "Grand Archivist";
    encouragement = "Publish 1 more dispatch to reach Lumen Legend and earn your 5th star.";
  } else {
    stars = 5;
    title = "Lumen Legend";
    encouragement = "You have reached peak status in the writing sanctuary! Absolute legend.";
  }

  return { stars, title, encouragement };
};

function CmsPage() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const stats = getEditorStats(completedCount);

  const [session, setSession] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    supabase_configured: boolean;
    groq_configured: boolean;
  } | null>(null);

  // Route guarding & Health Check: check if user is editor
  useEffect(() => {
    setMounted(true);
    const s = auth.getSession();
    setSession(s);
    if (!s || s.role !== "editor") {
      toast.error("Access restricted to Editors.");
      navigate({ to: "/login" });
    }

    // Check backend health for API vs Fallback cue
    fetch(`${API_URL}/api/health`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setHealthStatus(data);
      })
      .catch(() => {
        setHealthStatus({ supabase_configured: false, groq_configured: false });
      });
  }, []);

  const fetchQueue = () => {
    if (!session) return;
    fetch(`${API_URL}/api/cms/my-articles?editor_id=${session.userId}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setJobs(data);
        // Check if there is any active processing job to animate
        const processingJob = data.find((job: IngestionJob) => job.status === "processing");
        if (processingJob && !activeJobId) {
          setActiveJobId(processingJob.id);
        }
      })
      .catch(() => {
        // Fallback mock dashboard submissions list if server is starting/down
        setJobs([
          {
            id: "mock-1",
            url: "lumen://dispatches/mock-1",
            title: "Neural models now reason in real time",
            category: "AI",
            status: "completed",
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
        ]);
      });
  };

  useEffect(() => {
    fetchQueue();
    const t = setInterval(fetchQueue, 4000);
    return () => clearInterval(t);
  }, [session, activeJobId]);

  // Simulate progress in UI when "processing" is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeJobId) {
      setActiveStep(0);
      interval = setInterval(() => {
        setActiveStep((step) => {
          if (step >= AGENT_STEPS.length - 1) {
            clearInterval(interval);
            setActiveJobId(null);
            fetchQueue();
            return AGENT_STEPS.length - 1;
          }
          return step + 1;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [activeJobId]);

  const handleSubmitUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cms/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl, editor_id: session?.userId }),
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      toast.success("Ingestion pipeline started successfully.");
      setInputUrl("");
      setActiveJobId(data.article_id || "mock-job");
      fetchQueue();
    } catch {
      // Mock job triggers
      toast.info("Ingestion started (Offline Mock mode).");
      const mockId = Math.random().toString();
      const mockJob: IngestionJob = {
        id: mockId,
        url: inputUrl,
        title: "Scraping: " + inputUrl.substring(0, 30) + "...",
        category: "General",
        status: "processing",
        created_at: new Date().toISOString(),
      };
      setJobs((prev) => [mockJob, ...prev]);
      setActiveJobId(mockId);
      setInputUrl("");
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  if (!mounted || !session || session.role !== "editor") {
    return null;
  }

  const isIndex = location.pathname === "/cms" || location.pathname === "/cms/";
  if (!isIndex) {
    return <Outlet />;
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col justify-between">
      <div className="grain-overlay" />
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto w-full relative z-10">
        {/* Editorial styled dashboard header */}
        <section className="border-b border-line pb-8 mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-ember font-medium tracking-[0.25em] uppercase text-xs mb-4 flex flex-wrap items-center gap-3">
              <span>Curation Workspace</span>
              {healthStatus && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-medium tracking-normal normal-case border ${
                    healthStatus.groq_configured
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${healthStatus.groq_configured ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
                  />
                  {healthStatus.groq_configured
                    ? "AI Engine: Live Groq API"
                    : "AI Engine: Offline Mock Mode"}
                </span>
              )}
            </p>
            <h1 className="font-serif leading-[0.95] text-5xl md:text-7xl text-foreground">
              Writer <span className="italic text-ember">Desk.</span>
            </h1>
            <p className="mt-4 text-sm text-foreground/50 max-w-xl font-light leading-relaxed">
              Compose manual dispatches or scrape source URL materials. Our multi-AI-agent pipeline
              will analyze themes, generate, and optimize reading cards.
            </p>
          </div>

          <Link
            to="/cms/new"
            className="self-start md:self-end px-7 py-4 bg-ember text-ink hover:bg-paper transition-all cursor-pointer font-medium text-xs tracking-[0.2em] uppercase flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Create New Work
          </Link>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Input / URL Scraper & Processing step tracker */}
          <div className="lg:col-span-7 space-y-12">
            {/* Active Pipeline step tracker */}
            {activeJobId && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-line bg-card/25 p-8 rounded-lg"
              >
                <h3 className="font-serif text-xl text-foreground mb-6 flex items-center gap-3">
                  <RefreshCw className="h-4 w-4 text-ember animate-spin" /> Ingestion Pipeline
                  Running...
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {AGENT_STEPS.map((step, idx) => {
                    const isDone = idx < activeStep;
                    const isCurrent = idx === activeStep;

                    return (
                      <div
                        key={step}
                        className={`border p-4 flex flex-col justify-between h-28 transition-all duration-500 ${
                          isDone
                            ? "border-ember/40 bg-ember/5 text-foreground"
                            : isCurrent
                              ? "border-ember bg-card/60 text-foreground"
                              : "border-line text-foreground/30"
                        }`}
                      >
                        <span className="text-[10px] tracking-widest uppercase text-foreground/50">
                          0{idx + 1}.
                        </span>
                        <div className="flex flex-col mt-auto">
                          <span
                            className={`text-[10px] uppercase tracking-wider font-medium leading-tight ${
                              isCurrent ? "text-ember font-serif italic" : ""
                            }`}
                          >
                            {step}
                          </span>
                          {isDone && <Check className="h-3 w-3 text-ember mt-1 self-end" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Ingestion URL Form */}
            <div className="border border-line bg-card/10 p-8 rounded-lg">
              <h2 className="font-serif text-2xl text-foreground mb-3">
                Scrape Ingest Alternative
              </h2>
              <p className="text-xs text-foreground/50 mb-6 font-light">
                Paste an external article URL. A web scraper will fetch content before triggering
                the Multi-AI pipeline.
              </p>
              <form onSubmit={handleSubmitUrl} className="flex gap-4">
                <div className="relative flex-1">
                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/35" />
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://example.com/editorial-piece"
                    required
                    className="w-full bg-ink border border-line rounded-none pl-12 pr-5 py-4 text-sm focus:outline-none focus:border-ember text-foreground placeholder:text-foreground/20"
                    disabled={loading || activeJobId !== null}
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-4 bg-ember text-ink hover:bg-paper transition-all cursor-pointer font-medium text-xs tracking-[0.15em] uppercase flex items-center gap-2 disabled:opacity-40"
                  disabled={loading || activeJobId !== null}
                >
                  <Check className="h-4 w-4" /> Ingest
                </button>
              </form>
            </div>
          </div>

          {/* Right: Score/achievement panel & link to My Work */}
          <div className="lg:col-span-5 border border-line bg-card/10 p-8 rounded-lg space-y-8">
            <div className="space-y-4">
              <div>
                <h2 className="font-serif text-2xl text-foreground mb-1">Writer Achievement</h2>
                <p className="text-xs text-foreground/50 font-light">
                  Earn stars and points for every dispatch successfully compiled in the sanctuary.
                </p>
              </div>

              {/* Link to My Work (At top) */}
              <Link
                to="/cms/work"
                className="w-full py-4 bg-ink border border-line hover:border-ember/40 hover:text-ember flex items-center justify-center gap-2 text-xs uppercase tracking-[0.15em] font-semibold transition-all"
              >
                <FileText className="h-4 w-4" /> Go to My Work ({jobs.length} total)
              </Link>
            </div>

            {/* Achievement Card */}
            <div className="border border-line bg-ink/40 p-6 rounded-lg space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-ember/5 rounded-full blur-2xl animate-pulse" />

              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ember font-semibold">
                    Editor Status
                  </p>
                  <h3 className="text-xl font-serif mt-1">{stats.title}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 font-semibold">
                    Total Score
                  </p>
                  <p className="text-xl font-serif text-ember mt-1 font-semibold">
                    {completedCount * 150}{" "}
                    <span className="text-[10px] uppercase tracking-normal font-sans text-foreground/60">
                      pts
                    </span>
                  </p>
                </div>
              </div>

              {/* Star Rating Section */}
              <div className="space-y-2.5 relative z-10">
                <p className="text-[10px] uppercase tracking-[0.15em] text-foreground/45 font-medium">
                  Stars Earned ({stats.stars})
                </p>
                <div className="flex flex-wrap gap-2.5 min-h-[28px] items-center">
                  {stats.stars === 0 ? (
                    <span className="text-[11px] text-foreground/30 italic">
                      No stars earned yet. Publish more dispatches.
                    </span>
                  ) : (
                    Array.from({ length: stats.stars }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}
                      >
                        <Star className="h-6 w-6 text-ember fill-ember filter drop-shadow-[0_0_4px_rgba(232,93,58,0.4)]" />
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Encouragement Note */}
              <div className="border-t border-line/45 pt-4 relative z-10">
                <p className="text-[11px] text-foreground/60 leading-relaxed italic">
                  {stats.encouragement}
                </p>
              </div>

              {/* Share Button */}
              <button
                onClick={() => {
                  const shareText = `I've reached the status of "${stats.title}" on Lumen, collecting ${stats.stars} star${stats.stars !== 1 ? "s" : ""}! 🌟 Write with us at the sanctuary.`;
                  navigator.clipboard.writeText(shareText);
                  toast.success("Achievement copied to clipboard! Share it with the world.");
                }}
                className="w-full py-3 border border-line hover:border-ember hover:bg-ember/5 text-[10px] uppercase tracking-[0.2em] font-semibold text-foreground/80 hover:text-foreground flex items-center justify-center gap-2 transition-all cursor-pointer relative z-10"
              >
                <Share2 className="h-3.5 w-3.5" /> Share Achievement
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
