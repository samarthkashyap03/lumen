import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";

export function CtaSection() {
  return (
    <section className="relative py-32 px-6 md:px-12 lg:px-20 border-t border-line">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-5xl text-center"
      >
        <p className="text-xs font-medium tracking-[0.25em] uppercase text-ember mb-10">
          Ready to read differently?
        </p>
        <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.9]">
          Start reading with <span className="italic text-ember">intention.</span>
        </h2>
        <p className="mt-10 max-w-xl mx-auto text-lg text-foreground/65 leading-relaxed">
          Lumen is free to start. Join readers who've swapped the noise of social feeds for something that actually leaves them feeling informed.
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            search={{ role: "reader" }}
            className="px-8 py-4 bg-ember text-ink font-medium text-xs tracking-[0.2em] uppercase hover:bg-paper transition-colors duration-500"
          >
            Get Started Free
          </Link>
          <Link
            to="/register"
            search={{ role: "editor" }}
            className="px-8 py-4 border border-line text-xs tracking-[0.2em] uppercase hover:bg-card transition-colors duration-500"
          >
            Contribute as Editor
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
