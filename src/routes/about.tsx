import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Lumen" },
      {
        name: "description",
        content: "What Lumen is, how to read articles, and how to publish as an editor.",
      },
      { property: "og:title", content: "About — Lumen" },
      { property: "og:description", content: "Journalism made readable. Learn how Lumen works." },
    ],
  }),
  component: About,
});

const PILLARS = [
  {
    title: "Respecting the Reader",
    subtitle: "Your attention is yours.",
    desc: "We built Lumen because we were tired of being treated as metrics. The modern internet is designed to keep you scrolling, clicking, and engaged at all costs. Lumen is designed to let you finish. We give you the core ideas immediately, so you can decide if a story is worth your time. No infinite feeds, no clickbait, no noise.",
  },
  {
    title: "Empowering the Writer",
    subtitle: "Write for humans, not algorithms.",
    desc: "Writers should spend their time researching and crafting great stories, not worrying about SEO, formatting, or algorithm-friendly headlines. Lumen handles the packaging, the summaries, and the distribution. You just bring the substance.",
  },
];

function About() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div className="grain-overlay" />
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-[60vh] flex flex-col justify-end px-6 md:px-12 lg:px-20 pt-32 pb-16 border-b border-line">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl"
        >
          <p className="text-ember font-medium tracking-[0.25em] uppercase text-xs mb-8 flex items-center gap-4">
            <span className="h-px w-12 bg-ember" />
            Manifesto
          </p>
          <h1 className="font-serif italic leading-[0.95] tracking-tight text-[clamp(3rem,9vw,7rem)] mb-8">
            Journalism made
            <span className="block text-ember mt-2">actually readable.</span>
          </h1>
          <p className="text-lg text-foreground/65 font-light max-w-xl border-l-2 border-ember pl-5 leading-snug">
            Lumen is a reading platform where editors publish full articles and readers get them in
            plain, bite-sized summaries — no noise, no algorithm.
          </p>
        </motion.div>
      </section>

      {/* ── What is Lumen ── */}
      <section className="px-6 md:px-12 lg:px-20 py-24 border-b border-line">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4">
            <p className="text-xs uppercase tracking-[0.25em] text-ember font-medium">The idea</p>
          </div>
          <div className="lg:col-span-8 space-y-6 text-lg md:text-xl text-foreground/75 leading-relaxed font-light">
            <p>
              News today is overwhelming. You open an app and get hit with hundreds of headlines,
              most of them designed to make you anxious, not informed. Reading a full article can
              take 15 minutes. Most people just skip it.
            </p>
            <p className="border-l-2 border-ember pl-6 py-1 text-foreground/85">
              Lumen fixes this. Editors write real articles. Lumen's AI reads each one and creates 3
              short summary cards — the key points, in plain language. Readers get the gist in 90
              seconds, or can tap through to the full piece.
            </p>
            <p>
              There's no social feed, no trending algorithm, no ads. Just a clean reading experience
              built around one idea: your attention is valuable, and it deserves to be respected.
            </p>
          </div>
        </div>
      </section>

      {/* ── Core Pillars ── */}
      <section className="px-6 md:px-12 lg:px-20 py-24 border-b border-line">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            {PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-ember font-medium mb-4">
                    {pillar.subtitle}
                  </p>
                  <h2 className="font-serif italic leading-[0.95] text-4xl md:text-5xl text-foreground">
                    {pillar.title}.
                  </h2>
                </div>
                <p className="text-foreground/70 text-lg leading-relaxed font-light border-l-2 border-line pl-6">
                  {pillar.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Creator Bio ── */}
      <section className="px-6 md:px-12 lg:px-20 py-16 border-b border-line">
        <div className="max-w-3xl mx-auto border border-line bg-card/10 rounded-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Photo with Glow */}
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 rounded-full blur-xl opacity-30"></div>
              <img
                src="https://github.com/samarthkashyap03.png"
                alt="Samarth Kashyap"
                className="relative h-28 w-28 md:h-36 md:w-36 rounded-full object-cover border-2 border-line/20 shadow-lg"
              />
            </div>

            {/* Bio Content */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-1">
                  Samarth Kashyap
                </h2>
                <p className="text-xs md:text-[13px] text-cyan-400 font-medium">
                  MSc Computer Science @ RPTU | Builder of Lumen
                </p>
              </div>

              <div className="space-y-3 text-foreground/75 leading-relaxed font-light text-sm">
                <p>
                  I'm a computer science graduate student at RPTU, currently focused on building
                  scalable systems that solve real-world problems.
                </p>
                <p>
                  I saw how overwhelming and algorithmic the modern news feed had become. People
                  wanting to read genuine long-form journalism were bombarded with noise. Lumen came
                  from that frustration, building a way to respect the reader's time and attention
                  without sacrificing the depth of original writing.
                </p>
              </div>

              <blockquote className="text-base md:text-lg font-serif italic text-foreground/90 font-medium tracking-wide">
                “A developer is like a magician — turning ideas into reality through creativity,
                logic, and code. ”
              </blockquote>

              <p className="text-[11px] md:text-xs italic text-foreground/50 font-light">
                If you're interested in improving lumen or want to collaborate, you're welcome to
                reach out.
              </p>

              <div className="flex gap-4 pt-2">
                <a
                  href="https://github.com/samarthkashyap03"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 border border-line/60 rounded-full text-xs font-medium hover:bg-card hover:text-foreground text-foreground/80 transition-colors bg-ink/50"
                >
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/samarth-kashyap-138b7921a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 border border-line/60 rounded-full text-xs font-medium hover:bg-card hover:text-foreground text-foreground/80 transition-colors bg-ink/50"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-6 md:px-12 lg:px-20 py-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border-t border-line pt-12">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-ember font-medium mb-3">
              Ready?
            </p>
            <h2 className="font-serif text-4xl md:text-5xl">
              Pick your role and <span className="italic text-ember">get started.</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/feed"
              className="px-8 py-4 bg-ember text-ink font-medium text-xs tracking-[0.2em] uppercase hover:bg-paper transition-colors duration-500"
            >
              Read Articles
            </Link>
            <Link
              to="/cms"
              className="px-8 py-4 border border-line text-xs tracking-[0.2em] uppercase hover:bg-card transition-colors duration-500"
            >
              Publish as Editor
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
