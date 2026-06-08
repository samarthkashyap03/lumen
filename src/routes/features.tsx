import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import {
  Zap,
  BookOpen,
  MessageSquare,
  Edit3,
  BarChart,
  Settings2,
  CheckCircle,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";

// @ts-ignore
export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Lumen" },
      { name: "description", content: "Explore how Lumen makes reading and writing effortless." },
    ],
  }),
  component: FeaturesPage,
});

function FeatureSection({
  title,
  description,
  icon: Icon,
  reverse = false,
  visual,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  reverse?: boolean;
  visual: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-8 md:gap-16 py-20 border-b border-line items-center ${reverse ? "md:flex-row-reverse" : "md:flex-row"}`}
    >
      <div className="flex-1 w-full">
        <div className="h-12 w-12 border border-line bg-card/40 flex items-center justify-center mb-8">
          <Icon className="h-5 w-5 text-ember" />
        </div>
        <h3 className="font-serif text-3xl md:text-4xl text-foreground mb-6 leading-tight">
          {title}
        </h3>
        <p className="text-foreground/70 text-lg leading-relaxed font-light">{description}</p>
      </div>
      <div className="flex-1 w-full flex items-center justify-center bg-card/5 border border-line/50 rounded-2xl p-6 md:p-10 min-h-[350px] relative overflow-hidden group">
        {visual}
      </div>
    </div>
  );
}

function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<"readers" | "editors">("readers");

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div className="grain-overlay" />
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto w-full relative z-10">
        {/* Hero */}
        <section className="mb-16">
          <p className="text-ember font-medium tracking-[0.25em] uppercase text-xs mb-6">
            The platform
          </p>
          <h1 className="font-serif text-[clamp(3rem,8vw,6rem)] leading-[0.95] max-w-4xl mb-8">
            Every feature, <span className="italic text-ember">designed for focus.</span>
          </h1>
          <p className="text-xl text-foreground/60 max-w-2xl font-light leading-relaxed">
            Lumen is built to respect your time. Select your profile below to see how Lumen
            streamlines your workflow.
          </p>
        </section>

        {/* Tab Selection Switch */}
        <div className="flex justify-center mb-16">
          <div className="inline-flex p-1.5 border border-line bg-card/20 rounded-full relative z-20">
            <button
              onClick={() => setActiveTab("readers")}
              className={`px-8 py-3 rounded-full text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 cursor-pointer ${
                activeTab === "readers"
                  ? "bg-ember text-ink shadow-lg shadow-ember/15"
                  : "text-foreground/50 hover:text-foreground"
              }`}
            >
              For Readers
            </button>
            <button
              onClick={() => setActiveTab("editors")}
              className={`px-8 py-3 rounded-full text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 cursor-pointer ${
                activeTab === "editors"
                  ? "bg-ember text-ink shadow-lg shadow-ember/15"
                  : "text-foreground/50 hover:text-foreground"
              }`}
            >
              For Editors & Writers
            </button>
          </div>
        </div>

        {/* Dynamic Content Sections */}
        <div className="min-h-[600px]">
          <AnimatePresence mode="wait">
            {activeTab === "readers" ? (
              <motion.div
                key="readers"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground/40 border-b border-line pb-4">
                    Reader Features
                  </h2>
                </div>

                <FeatureSection
                  title="The 90-Second Swipe"
                  description="We know you're busy. That's why every long article is automatically summarized into three simple, bite-sized cards. Just swipe through to get the core ideas in under 90 seconds without skimming through clutter."
                  icon={Zap}
                  visual={
                    <div className="relative w-full max-w-[280px] aspect-[4/5] flex items-center justify-center">
                      {/* Stack Card 3 */}
                      <div className="absolute w-full h-full border border-line bg-card/10 rounded-2xl rotate-6 translate-x-4 opacity-30 pointer-events-none scale-95" />
                      {/* Stack Card 2 */}
                      <div className="absolute w-full h-full border border-line bg-card/30 rounded-2xl -rotate-3 -translate-x-2 opacity-60 pointer-events-none scale-98" />
                      {/* Active Card */}
                      <motion.div
                        whileHover={{ y: -5, rotate: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute w-full h-full border border-ember/30 bg-ink shadow-2xl rounded-2xl p-6 flex flex-col justify-between"
                        style={{ boxShadow: "0 0 30px rgba(229, 9, 20, 0.05)" }}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] uppercase font-mono tracking-widest text-ember bg-ember/10 px-2 py-0.5 rounded">
                              Technology
                            </span>
                            <span className="text-xs text-foreground/40 font-mono">1 / 3</span>
                          </div>
                          <h4 className="font-serif text-lg text-foreground mb-3 leading-snug">
                            The Rise of Agentic AI
                          </h4>
                          <p className="text-xs text-foreground/70 leading-relaxed font-light">
                            AI is transitioning from passive responders to active agents that can
                            execute workflows, plan projects, and collaborate.
                          </p>
                        </div>
                        <div className="flex justify-between items-center border-t border-line/50 pt-4 mt-4 text-[10px] text-foreground/40 uppercase tracking-wider">
                          <span>Swipe to continue</span>
                          <Zap className="h-3 w-3 text-ember" />
                        </div>
                      </motion.div>
                    </div>
                  }
                />

                <FeatureSection
                  title="Immersive Deep Reading"
                  description="If a summary catches your eye and you want the full story, tap into the original article. Our reading mode is incredibly clean—no pop-ups, no sidebars, no ads. Just beautiful typography and the writer's original words."
                  icon={BookOpen}
                  reverse
                  visual={
                    <div className="w-full max-w-[320px] border border-line bg-ink rounded-xl overflow-hidden shadow-2xl font-serif">
                      <div className="border-b border-line px-4 py-3 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                        <span className="text-[10px] text-foreground/45 font-mono ml-4 truncate">
                          lumen.press/article/silent-sanctuary
                        </span>
                      </div>
                      <div className="p-6 h-[220px] overflow-hidden relative">
                        <h4 className="text-xl mb-3 text-foreground leading-tight">
                          The Silent Sanctuary
                        </h4>
                        <div className="text-[10px] font-sans text-foreground/50 mb-4 uppercase tracking-wider">
                          By Helen Carter • 5 Min Read
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed font-light mb-3">
                          In an era dominated by relentless notification pings and algorithmic
                          feedback loops, our attention span has become a highly contested
                          commodity.
                        </p>
                        <p className="text-xs text-foreground/80 leading-relaxed font-light">
                          To protect this cognitive resource, new spaces must be constructed. Spaces
                          that prioritize deep reflection over mindless scrolling...
                        </p>
                        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-ink to-transparent" />
                      </div>
                    </div>
                  }
                />

                <FeatureSection
                  title="Ask the AI Assistant"
                  description="Have a specific question about an article? Don't want to read the whole thing to find one fact? Just ask our AI. You can chat with it to find specific details from any dispatch, or search across everything we've ever published."
                  icon={MessageSquare}
                  visual={
                    <div className="w-full max-w-[320px] border border-line bg-ink rounded-xl p-4 flex flex-col justify-between min-h-[260px] shadow-2xl font-sans">
                      <div className="space-y-4">
                        <div className="flex gap-2.5 items-start">
                          <div className="h-6 w-6 rounded-full bg-line flex items-center justify-center text-[10px] font-semibold text-foreground/75">
                            U
                          </div>
                          <div className="bg-card/45 border border-line rounded-lg p-2.5 max-w-[80%]">
                            <p className="text-[11px] text-foreground/80">
                              Summarize the main critique of the new architecture.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2.5 items-start justify-end">
                          <div className="bg-ember/5 border border-ember/25 rounded-lg p-2.5 max-w-[80%] text-right">
                            <p className="text-[11px] text-foreground/90">
                              It highlights high latency and coordination complexity among
                              autonomous nodes.
                            </p>
                          </div>
                          <div className="h-6 w-6 rounded-full bg-ember/20 border border-ember/30 flex items-center justify-center text-[10px] font-semibold text-ember">
                            L
                          </div>
                        </div>
                      </div>
                      <div className="border border-line rounded-lg bg-card/10 p-2 flex items-center justify-between mt-4">
                        <span className="text-[10px] text-foreground/50">
                          Ask Lumen anything...
                        </span>
                        <Sparkles className="h-3.5 w-3.5 text-ember" />
                      </div>
                    </div>
                  }
                />
              </motion.div>
            ) : (
              <motion.div
                key="editors"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground/40 border-b border-line pb-4">
                    Editor & Writer Features
                  </h2>
                </div>

                <FeatureSection
                  title="Write Normally, Let AI Do the Rest"
                  description="Just focus on writing your best article. When you hit publish, our AI team automatically reads your piece, chunks the text, extracts key themes, generates vector memory, and drafts three summaries. No extra publishing steps required."
                  icon={Edit3}
                  visual={
                    <div className="w-full max-w-[340px] border border-line bg-ink rounded-xl p-5 shadow-2xl font-sans flex flex-col gap-4">
                      <div className="flex justify-between items-center border-b border-line pb-3">
                        <span className="text-xs font-semibold text-foreground/80">
                          Composer Sandbox
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />{" "}
                          Ingesting
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="h-3 w-1/3 bg-line/60 rounded" />
                        <div className="h-2 w-full bg-line/30 rounded" />
                        <div className="h-2 w-full bg-line/30 rounded" />
                        <div className="h-2 w-3/4 bg-line/30 rounded" />
                      </div>
                      {/* AI Agent Assembly Line Status */}
                      <div className="border-t border-line/50 pt-3 mt-1 space-y-2">
                        <div className="text-[9px] uppercase tracking-wider text-foreground/40 mb-2 font-mono">
                          AI Agents Processing
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-foreground/70">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Analyzer Agent
                          </span>
                          <span className="text-[9px] font-mono text-foreground/40">
                            Themes Mapped
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-foreground/70">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Chunker Agent
                          </span>
                          <span className="text-[9px] font-mono text-foreground/40">
                            12 Paragraphs
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-foreground/75 font-medium">
                          <span className="flex items-center gap-1.5">
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-t-transparent border-ember animate-spin" />{" "}
                            Card Generator
                          </span>
                          <span className="text-[9px] font-mono text-ember">
                            Drafting Insight 2...
                          </span>
                        </div>
                      </div>
                    </div>
                  }
                />

                <FeatureSection
                  title="See What Actually Resonates"
                  description="Most sites just tell you 'clicks'. Lumen tells you how people are really interacting with your work. See exactly how many people swiped your summaries versus how many stayed to read the full deep-dive."
                  icon={BarChart}
                  reverse
                  visual={
                    <div className="w-full max-w-[300px] border border-line bg-ink rounded-xl p-5 shadow-2xl font-sans space-y-5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-foreground/80">
                          Pulse Analytics
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-ember bg-ember/10 px-2 py-0.5 rounded font-mono">
                          Live
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-line/55 bg-card/20 p-3 rounded-lg">
                          <div className="text-[9px] text-foreground/40 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Completion
                          </div>
                          <div className="text-lg font-serif mt-1">78.4%</div>
                        </div>
                        <div className="border border-line/55 bg-card/20 p-3 rounded-lg">
                          <div className="text-[9px] text-foreground/40 uppercase tracking-wider flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Read Rate
                          </div>
                          <div className="text-lg font-serif mt-1">42.1%</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-foreground/50">
                          <span>Card Swipe Funnel</span>
                          <span>100% → 84% → 68%</span>
                        </div>
                        <div className="w-full h-1.5 bg-line/30 rounded overflow-hidden flex">
                          <div className="h-full bg-ember w-[100%]" />
                          <div className="h-full bg-ember/70 w-[84%]" />
                          <div className="h-full bg-ember/40 w-[68%]" />
                        </div>
                      </div>
                    </div>
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA to Tech Stack */}
        <section className="mt-32 border border-line bg-card/10 rounded-2xl p-8 md:p-16 text-center max-w-4xl mx-auto flex flex-col items-center">
          <Settings2 className="h-10 w-10 text-ember mb-6" />
          <h2 className="font-serif text-4xl md:text-5xl mb-6">Curious how it works?</h2>
          <p className="text-lg text-foreground/60 font-light mb-10 max-w-xl leading-relaxed">
            All of this is powered by a behind-the-scenes team of AI agents working together like an
            assembly line. It's surprisingly simple once you break it down.
          </p>
          <Link
            to={"/tech-stack" as any}
            className="px-8 py-4 bg-ember text-ink font-semibold text-xs tracking-[0.2em] uppercase hover:bg-paper transition-all inline-block"
          >
            Read about our Tech Stack
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
