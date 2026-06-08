import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { SwipeCardPreview } from "./SwipeCardPreview";

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-end px-6 md:px-12 lg:px-20 pt-32 pb-20 overflow-hidden">
      <div className="grain-overlay" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-7"
        >
          <p className="text-ember font-medium tracking-[0.25em] uppercase text-xs mb-10 flex items-center gap-4">
            <span className="h-px w-12 bg-ember" />
            Issue 01 / Winter 26
          </p>

          <h1 className="font-serif italic leading-[0.95] tracking-tight text-[clamp(4rem,13vw,11rem)] mb-12">
            Journalism,
            <span className="block text-ember mt-2">recomposed.</span>
          </h1>

          <div className="max-w-lg space-y-8">
            <p className="text-lg text-foreground/65 leading-snug font-light border-l-2 border-ember pl-5">
              Full articles, cut to what matters. Read in 90 seconds or go deep — your choice.
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <Link
                to="/feed"
                className="px-8 py-4 bg-ember text-ink font-medium text-xs tracking-[0.15em] uppercase hover:bg-paper transition-colors duration-500 cursor-pointer"
              >
                Start Reading
              </Link>
              <button
                onClick={() =>
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-8 py-4 border border-line text-xs tracking-[0.15em] uppercase hover:bg-card transition-colors duration-500 cursor-pointer"
              >
                See How It Works
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, rotate: 6 }}
          animate={{ opacity: 1, y: 0, rotate: 3 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5 relative flex justify-center lg:justify-center mt-12 lg:mt-0 lg:translate-y-12"
        >
          <div className="relative">
            <div className="relative bg-card rounded-[2.5rem] p-3 shadow-2xl border border-line transform rotate-3 hover:rotate-0 transition-transform duration-700">
              <div className="rounded-[2rem] overflow-hidden bg-ink">
                <SwipeCardPreview />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-full h-full bg-card/40 rounded-[2.5rem] -z-10 border border-line/40" />
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 mt-24 pt-6 border-t border-line flex justify-between items-end">
        <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/40">
          Editorial No. 001
        </span>
        <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/40 font-serif italic">
          Designed for focus
        </span>
      </div>
    </section>
  );
}
