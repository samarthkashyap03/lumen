import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import catTech from "@/assets/cat-technology.jpg";
import catScience from "@/assets/cat-science.jpg";
import catPolitics from "@/assets/cat-politics.jpg";
import catStartups from "@/assets/cat-startups.jpg";
import catLifestyle from "@/assets/cat-lifestyle.jpg";
import catAi from "@/assets/cat-ai.jpg";
import catGeneral from "@/assets/cat-general.jpg";
import { API_URL } from "@/lib/config";

const MotionLink = motion.create(Link);

const CAT_META: Record<string, { image: string }> = {
  Technology: { image: catTech },
  Science: { image: catScience },
  Politics: { image: catPolitics },
  Startups: { image: catStartups },
  Lifestyle: { image: catLifestyle },
  AI: { image: catAi },
  General: { image: catGeneral },
};

type Counts = Record<string, number>;

export function FeaturedCategories() {
  const [counts, setCounts] = useState<Counts>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/categories/counts`)
      .then((r) => r.json())
      .then((data: Counts) => {
        setCounts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Build ordered list: known order, only show categories with images
  const orderedNames = ["AI", "Technology", "Science", "Politics", "Startups", "Lifestyle", "General"];
  const cats = orderedNames.map((name) => ({
    name,
    image: CAT_META[name].image,
    count: counts[name] ?? 0,
  }));

  return (
    <section className="relative py-32 px-6 md:px-12 lg:px-20 border-t border-line">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-8 flex-wrap mb-16">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-[0.25em] uppercase text-ember mb-6">Browse by topic</p>
            <h2 className="font-serif text-5xl md:text-7xl leading-[0.95] text-foreground">
              Find stories about what <span className="italic">matters to you.</span>
            </h2>
          </div>
          <p className="text-sm text-foreground/55 max-w-xs leading-relaxed">
            Pick a topic and explore the stories Lumen has collected just for it.
          </p>
        </div>

        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4 border border-line">
          {cats.map((c, i) => (
            <MotionLink
              key={c.name}
              to="/feed"
              search={{ category: c.name } as any}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`group relative overflow-hidden bg-ink ${
                i === cats.length - 1
                  ? "sm:col-span-2 lg:col-span-2 aspect-[8/5]"
                  : "aspect-[4/5]"
              }`}
            >
              <img
                src={c.image}
                alt={c.name}
                className="absolute inset-0 h-full w-full object-cover grayscale opacity-50 transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-90 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8">
                <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/50 mb-2">
                  {loading ? (
                    <span className="inline-block w-8 h-2 bg-foreground/20 rounded animate-pulse" />
                  ) : (
                    <>{c.count} {c.count === 1 ? "article" : "articles"}</>
                  )}
                </div>
                <div className="font-serif text-3xl text-foreground group-hover:italic group-hover:text-ember transition-all duration-300">
                  {c.name}
                </div>
              </div>
            </MotionLink>
          ))}
        </div>
      </div>
    </section>
  );
}
