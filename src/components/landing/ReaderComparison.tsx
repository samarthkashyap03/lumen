import { motion } from "motion/react";
import { SwipeCardPreview } from "./SwipeCardPreview";
import { CheckCircle2, XCircle } from "lucide-react";

export function ReaderComparison() {
  return (
    <section className="relative py-32 px-6 md:px-12 lg:px-20 border-t border-line">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl mb-20">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-ember mb-6">
            See it in action
          </p>
          <h2 className="font-serif text-5xl md:text-7xl leading-[0.95]">
            The same article. <span className="italic text-ember">In 90 seconds.</span>
          </h2>
          <p className="mt-8 text-lg text-foreground/65 max-w-xl leading-relaxed">
            Pick the full read when you have time, or swipe the summary when you don't. Lumen gives
            you both — always.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-2 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative border border-line p-8 bg-card/10 opacity-75 grayscale-[0.5]"
          >
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-foreground/50">
                <XCircle className="h-3.5 w-3.5 text-destructive/70" /> Traditional
              </div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/50 line-through">
                ~12 min read
              </div>
            </div>
            <div className="mt-6 space-y-5 max-h-[500px] overflow-hidden text-foreground/70 leading-relaxed">
              <h3 className="font-serif text-xl text-foreground leading-snug">
                Neural Models Now Reason in Real Time — And It Changes Everything
              </h3>
              <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">
                By Elena Rostova &nbsp;·&nbsp; June 7, 2026 &nbsp;·&nbsp; 12 min read
              </p>
              <p className="text-sm leading-relaxed">
                Artificial intelligence has undergone a fundamental architectural shift. By
                introducing compressed semantic trees into their inference stacks, next-generation
                reasoning networks are now capable of generating complete multi-step logical plans
                within milliseconds — a capability that was considered theoretical just eighteen
                months ago.
              </p>
              <p className="text-sm leading-relaxed">
                This represents a massive departure from the autoregressive paradigm that has
                defined the field since the release of GPT-2. Traditional large language models
                generate tokens one step at a time in strict sequence, which induces high
                computational latency and limits their ability to self-correct mid-output. Real-time
                models, by contrast, pre-evaluate potential reasoning pathways in parallel clusters,
                caching token hierarchies before any visible output execution begins.
              </p>
              <p className="text-sm leading-relaxed">
                The practical applications are immediate and far-reaching. Interactive voice
                interfaces now feel genuinely conversational — adjusting emphasis and pacing
                dynamically to coordinate with the natural beats of human speech. Researchers at
                MIT's CSAIL lab anticipate that this level of inference throughput will
                fundamentally redefine the consumer agent landscape in the coming twelve months,
                shifting focus away from raw parameter counts and toward sensory latency benchmarks
                as the primary measure of model quality.
              </p>
              <p className="text-sm leading-relaxed">
                Industry reaction has been swift. Three of the five largest cloud providers have
                already announced infrastructure upgrades designed to accommodate real-time
                reasoning workloads, and venture capital commitments to the sector surpassed $4.2
                billion in the first quarter alone — more than double the same period last year.
              </p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative border border-emerald-500/40 p-8 flex flex-col items-center bg-emerald-950/10"
          >
            <div className="w-full flex items-center justify-between border-b border-emerald-500/30 pb-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Lumen swipe
              </div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-emerald-400/80 font-medium">
                ~90 sec read
              </div>
            </div>
            <div className="mt-6 flex-1 flex items-center justify-center w-full">
              <SwipeCardPreview compact />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
