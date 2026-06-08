import { motion } from "motion/react";

const STEPS = [
  {
    n: "01.",
    title: "Editors publish the story",
    body: (
      <>
        Editors write and submit full-length articles through Lumen's dashboard. No social media
        noise, no engagement bait — <span className="italic text-ember">just real journalism</span>,
        written to inform.
      </>
    ),
    note: "* Any editor can submit. Every article goes through Lumen before it reaches readers.",
  },
  {
    n: "02.",
    title: "Lumen's AI shortens it",
    body: (
      <>
        Once an article is submitted, Lumen automatically generates a{" "}
        <span className="underline decoration-ember decoration-1 underline-offset-8">
          3-card summary
        </span>{" "}
        — each card a single key insight from the full piece. No fluff, no filler.
      </>
    ),
  },
  {
    n: "03.",
    title: "You read it your way",
    body: (
      <>
        Swipe through the short summary cards in under 90 seconds. If a story grabs you, tap through
        to read the <span className="italic">full article</span> at any time. Speed or depth — you
        decide.
      </>
    ),
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative px-6 md:px-12 lg:px-20 py-32 border-t border-line"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <h2 className="text-xs uppercase tracking-[0.25em] text-ember font-medium lg:sticky lg:top-32">
            How It Works
          </h2>
        </div>

        <div className="lg:col-span-8 space-y-24">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`group ${i < STEPS.length - 1 ? "border-b border-line pb-16" : ""}`}
            >
              <div className="flex items-baseline gap-6 md:gap-8 mb-6 flex-wrap">
                <span className="font-serif italic text-6xl md:text-7xl text-line group-hover:text-ember transition-colors duration-500">
                  {s.n}
                </span>
                <h3 className="font-serif text-3xl md:text-5xl text-foreground">{s.title}</h3>
              </div>
              <div className="lg:pl-32 max-w-2xl">
                <p className="text-lg md:text-xl leading-relaxed text-foreground/70">{s.body}</p>
                {s.note && (
                  <p className="mt-6 text-sm text-foreground/40 font-light italic leading-loose">
                    {s.note}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
