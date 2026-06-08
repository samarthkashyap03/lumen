import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import cardAi from "@/assets/card-ai.jpg";
import cardCity from "@/assets/card-city.jpg";
import cardSpace from "@/assets/card-space.jpg";

type Card = {
  id: number;
  image: string;
  category: string;
  title: string;
  summary: string;
};

const CARDS: Card[] = [
  {
    id: 1,
    image: cardAi,
    category: "Attention",
    title: "Settle into the story.",
    summary: "Lumen filters out the constant ping of notifications and fragmented news. Read curated articles in a calm, print-inspired layout designed to respect your focus.",
  },
  {
    id: 2,
    image: cardCity,
    category: "Curation",
    title: "Human intent, not algorithms.",
    summary: "Mindless feeds prioritize clicks and outrage. Lumen relies on editors who select content based on intellectual depth, giving you insights that actually matter.",
  },
  {
    id: 3,
    image: cardSpace,
    category: "Archiving",
    title: "Build your memory palace.",
    summary: "Important insights shouldn't get lost in the scroll. Save key takeaways directly to your personal library, organized for lifetime discovery.",
  },
];

export function SwipeCardPreview({ compact = false }: { compact?: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % CARDS.length), 3800);
    return () => clearInterval(t);
  }, []);

  const visible = [0, 1, 2].map((offset) => CARDS[(index + offset) % CARDS.length]);

  return (
    <div className={`relative mx-auto ${compact ? "h-[440px] w-[240px]" : "h-[560px] w-[300px]"}`}>
      <AnimatePresence mode="popLayout">
        {visible.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ y: i === 0 ? 0 : 30 + i * 14, scale: 1 - i * 0.05, opacity: i === 2 ? 0 : 1 }}
            animate={{
              y: i === 0 ? 0 : 30 + i * 14,
              scale: 1 - i * 0.05,
              opacity: i === 2 ? 0.4 : 1,
              zIndex: 10 - i,
            }}
            exit={{ y: -400, opacity: 0, rotate: -4, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 overflow-hidden bg-ink border border-line"
            style={{ zIndex: 10 - i, borderRadius: 20 }}
          >
            <div className="relative h-3/5 w-full overflow-hidden">
              <img
                src={card.image}
                alt={card.title}
                className="h-full w-full object-cover grayscale"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
              <div className="absolute top-3 left-3 text-[9px] uppercase tracking-[0.25em] text-ember">
                {card.category}
              </div>
            </div>
            <div className="flex h-2/5 flex-col gap-2 p-4">
              <div className="h-px w-8 bg-ember mb-1" />
              <h3 className="font-serif text-base leading-tight text-foreground">{card.title}</h3>
              <p className="text-[11px] leading-relaxed text-foreground/55 line-clamp-3">{card.summary}</p>
              {i === 0 && (
                <motion.div
                  className="mt-auto flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-[0.25em] text-foreground/40"
                  animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                >
                  <ArrowUp className="h-3 w-3" />
                  Swipe up
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
