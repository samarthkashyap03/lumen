import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import {
  Compass,
  Scissors,
  Cpu,
  CheckCircle,
  Sparkles,
  Layers,
  Database,
  Terminal,
  Server,
  Workflow,
} from "lucide-react";

// @ts-ignore
export const Route = createFileRoute("/tech-stack")({
  head: () => ({
    meta: [
      { title: "Tech Stack — Lumen" },
      {
        name: "description",
        content: "Learn about the Multi-Agent AI architecture and technology stack behind Lumen.",
      },
    ],
  }),
  component: TechStackPage,
});

const AGENTS = [
  {
    name: "1. The Chunker Agent",
    role: "The Organizer",
    type: "Pipeline Step",
    icon: Scissors,
    glow: "rgba(239, 68, 68, 0.15)",
    border: "border-red-500/30",
    desc: "Breaks long, complex articles down into small, digestible paragraphs. This makes it easier for the AI models to read, analyze, and retrieve information accurately.",
  },
  {
    name: "2. The Embedding Agent",
    role: "The Search Mapper",
    type: "Pipeline Step",
    icon: Layers,
    glow: "rgba(249, 115, 22, 0.15)",
    border: "border-orange-500/30",
    desc: "Turns paragraphs into search-friendly data so the AI can instantly find the right answers when you ask questions in the chat.",
  },
  {
    name: "3. The Analyzer Agent",
    role: "The Critic",
    type: "AI-Agent",
    icon: Compass,
    glow: "rgba(234, 179, 8, 0.15)",
    border: "border-yellow-500/30",
    desc: "Reads the article to identify the main themes, tone of voice, and core takeaways. It creates a detailed blueprint that guides the rest of the AI team.",
  },
  {
    name: "4. The Generator Agent",
    role: "The Writer",
    type: "AI-Agent",
    icon: Cpu,
    glow: "rgba(34, 197, 94, 0.15)",
    border: "border-green-500/30",
    desc: "Follows the Analyzer's blueprint to write three brief summary cards. It ensures the most critical information gets highlighted first.",
  },
  {
    name: "5. The Validator Agent",
    role: "The Fact Checker",
    type: "Pipeline Step",
    icon: CheckCircle,
    glow: "rgba(59, 130, 246, 0.15)",
    border: "border-blue-500/30",
    desc: "Double-checks the generated cards against the original article to make sure there are no errors, false claims, or formatting bugs.",
  },
  {
    name: "6. The Optimizer Agent",
    role: "The Copy Editor",
    type: "AI-Agent",
    icon: Sparkles,
    glow: "rgba(168, 85, 247, 0.15)",
    border: "border-purple-500/30",
    desc: "Polishes the wording, adjusts paragraph lengths, and applies clean bold styling to key terms to make the cards look beautiful and scan-friendly.",
  },
  {
    name: "7. The Publishing Agent",
    role: "The Curator",
    type: "Pipeline Step",
    icon: Database,
    glow: "rgba(236, 72, 153, 0.15)",
    border: "border-pink-500/30",
    desc: "Saves the finished summary cards, search data, and the original article to the database so they are ready for readers to enjoy.",
  },
];

const STACK_ITEMS = [
  {
    title: "Client & UI Interface",
    tech: "React, Tailwind CSS, TanStack Router",
    desc: "A fast, beautiful user interface built with smooth animations and clean typography.",
  },
  {
    title: "Application Server",
    tech: "FastAPI, Python",
    desc: "The engine that runs the AI assembly line, manages data, and handles all search requests.",
  },
  {
    title: "Database & Semantic Memory",
    tech: "PostgreSQL, pgvector",
    desc: "Stores all articles and user accounts, and powers the instant AI chat search.",
  },
];

function TechStackPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div className="grain-overlay" />
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto w-full relative z-10">
        {/* Hero */}
        <section className="mb-24">
          <p className="text-ember font-medium tracking-[0.25em] uppercase text-xs mb-6 flex items-center gap-2">
            <Terminal className="h-4 w-4" /> System Architecture
          </p>
          <h1 className="font-serif text-[clamp(3rem,7vw,5.5rem)] leading-[0.95] max-w-4xl mb-8">
            How Lumen works, <span className="italic text-ember">under the hood.</span>
          </h1>
          <p className="text-xl text-foreground/60 max-w-2xl font-light leading-relaxed">
            Lumen uses a team of specialized AI agents working together to turn long articles into
            short, readable cards.
          </p>
        </section>

        {/* The Pipeline Intro */}
        <section className="mb-20">
          <div className="flex items-center gap-3 border-b border-line pb-4 mb-12">
            <Workflow className="h-5 w-5 text-ember" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground/75">
              The Multi-Agent AI Pipeline
            </h2>
          </div>

          <p className="text-lg text-foreground/70 mb-12 max-w-3xl leading-relaxed font-light">
            When an article is published, it goes through an automated assembly line. The three core{" "}
            <strong className="text-foreground font-semibold">AI-Agents</strong> handle the reading,
            writing, and editing, while the other steps handle the background technical work.
          </p>

          {/* Flowchart / Interactive list */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AGENTS.map((agent, idx) => {
              const Icon = agent.icon;
              const isCoreAi = agent.type === "AI-Agent";
              return (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className={`border ${isCoreAi ? "border-ember/40 bg-card/10" : "border-line bg-card/5"} p-6 rounded-xl relative overflow-hidden group hover:border-foreground/20 transition-all`}
                  style={{
                    boxShadow: `inset 0 0 20px ${agent.glow}`,
                  }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="h-10 w-10 border border-line bg-card flex items-center justify-center">
                      <Icon className="h-5 w-5 text-ember" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider bg-line/30 px-2 py-1 rounded text-foreground/50">
                        {agent.role}
                      </span>
                      <span
                        className={`text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                          isCoreAi
                            ? "bg-ember/15 border-ember/30 text-ember font-bold"
                            : "bg-line/20 border-line/45 text-foreground/40"
                        }`}
                      >
                        {agent.type}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-serif text-xl mb-3 text-foreground">{agent.name}</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed font-light">
                    {agent.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* System Stack */}
        <section className="mt-32">
          <div className="flex items-center gap-3 border-b border-line pb-4 mb-12">
            <Server className="h-5 w-5 text-ember" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground/75">
              Core Tech Stack
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STACK_ITEMS.map((item, idx) => (
              <div key={item.title} className="border border-line bg-card/10 rounded-xl p-8">
                <h3 className="font-serif text-2xl mb-4 text-foreground">{item.title}</h3>
                <p className="text-xs font-mono text-ember uppercase tracking-wider mb-4">
                  {item.tech}
                </p>
                <p className="text-sm text-foreground/60 leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
