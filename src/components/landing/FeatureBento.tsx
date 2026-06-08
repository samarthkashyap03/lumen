import { motion } from "motion/react";

const ROWS = [
  ["Infinite scroll, no end point", "Curated articles, clear stopping point"],
  ["Algorithm decides what you see", "Lumen editors decide what you see"],
  ["Designed to keep you hooked", "Designed to let you actually finish"],
  ["Your reading data is a product", "Your reading stays private"],
];

export function FeatureBento() {
  return (
    <section className="relative bg-card py-32 px-6 md:px-12 lg:px-20 overflow-hidden border-t border-line">
      <div className="grain-overlay" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-24 items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-12"
          >
            <h2 className="font-serif italic leading-[0.9] text-foreground text-5xl md:text-7xl lg:text-8xl">
              Built for <span className="text-ember">readers,</span> not metrics.
            </h2>
            <div className="space-y-8 text-lg md:text-xl text-foreground/80 leading-relaxed max-w-xl">
              <p>
                Most news apps are built to maximize time spent. Lumen is built to make that time
                feel worthwhile. There's a difference — and you can feel it in the first five
                minutes.
              </p>
              <p className="lg:pl-8 border-l border-ember py-2">
                Lumen's design is inspired by print magazines: clean layouts, no pop-ups, no
                autoplay. Just the story, the way it was meant to be read.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative lg:pt-24"
          >
            <p className="text-ember uppercase tracking-[0.25em] text-xs mb-10">What's different</p>

            <div className="border-t border-line pt-8">
              <div className="grid grid-cols-2 gap-8 border-b border-line pb-8 mb-10">
                <p className="font-serif italic text-2xl md:text-3xl text-foreground/60">
                  Other apps
                </p>
                <p className="font-serif italic text-2xl md:text-3xl text-ember">Lumen</p>
              </div>

              <div className="divide-y divide-line/60">
                {ROWS.map(([a, b], i) => (
                  <motion.div
                    key={a}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.05 * i }}
                    className="grid grid-cols-2 gap-8 py-6"
                  >
                    <p className="text-sm text-foreground/45 uppercase tracking-[0.12em]">{a}</p>
                    <p className="text-sm text-foreground/75 uppercase tracking-[0.12em]">{b}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="absolute -right-2 top-1/2 -rotate-90 origin-right hidden xl:block">
              <p className="text-[10px] uppercase tracking-[0.4em] text-foreground/20 whitespace-nowrap">
                Reading, the way it should feel — Lumen 2026
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
