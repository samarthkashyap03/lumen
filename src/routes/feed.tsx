import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ArrowRight, BookOpen, MessageSquare, Search } from "lucide-react";
import { auth } from "@/lib/auth";
import { API_URL } from "@/lib/config";

type FeedSearch = {
  category?: string;
};

export const Route = createFileRoute("/feed")({
  validateSearch: (search: Record<string, unknown>): FeedSearch => {
    return {
      category: search.category as string | undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "The Feed — Lumen" },
      { name: "description", content: "Settle into today's recomposed dispatches." },
    ],
  }),
  component: FeedPage,
});

type SwipeCard = {
  id: string;
  category: string;
  title: string;
  summary: string;
};

type Article = {
  id: string;
  title: string;
  author: string;
  category: string;
  body_text: string;
  published_at: string;
  cards?: SwipeCard[];
};

// High-end fallback article content
const MOCK_ARTICLES: Article[] = [
  {
    id: "1",
    title: "Neural models now reason in real time.",
    author: "Elena Rostova",
    category: "AI",
    body_text:
      "A new architecture compresses thought into milliseconds — assistants that respond before you finish your sentence...",
    published_at: new Date().toISOString(),
    cards: [
      {
        id: "c1",
        category: "AI",
        title: "Real-time *Inference*",
        summary: "A new architecture compresses semantic thought into milliseconds.",
      },
    ],
  },
  {
    id: "2",
    title: "Tokyo unveils carbon-neutral district.",
    author: "Kaito Sato",
    category: "Cities",
    body_text:
      "Smart grids, vertical forests, and AI traffic flow cut emissions by 84% in a single year...",
    published_at: new Date().toISOString(),
    cards: [
      {
        id: "c2",
        category: "Cities",
        title: "Smart *Grids*",
        summary: "Smart grids and vertical forests cut carbon emissions by 84.",
      },
    ],
  },
  {
    id: "3",
    title: "JWST captures the youngest galaxy ever observed.",
    author: "Dr. Marcus Vance",
    category: "Science",
    body_text:
      "Light from 290 million years after the Big Bang reveals how stars forged elements...",
    published_at: new Date().toISOString(),
    cards: [
      {
        id: "c3",
        category: "Science",
        title: "JWST *Galaxy*",
        summary: "Galaxies formed 290 million years after the big bang detected.",
      },
    ],
  },
];

function FeedPage() {
  const { category } = Route.useSearch();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(auth.isAuthenticated());
    fetch(`${API_URL}/api/articles`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setArticles(data.length > 0 ? data : MOCK_ARTICLES);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to mock data if backend not active
        setArticles(MOCK_ARTICLES);
        setLoading(false);
      });
  }, []);

  // Filter based on category and search query
  const filteredArticles = articles.filter((art) => {
    const matchesCategory = !category || art.category.toLowerCase() === category.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const visibleArticles = isLoggedIn ? filteredArticles : filteredArticles.slice(0, 3);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col justify-between">
      <div className="grain-overlay" />
      <Navbar />

      <main className="flex-1 pt-24 pb-32">
        {/* Search and Category Info Toolbar */}
        <section className="px-6 md:px-12 lg:px-20 pt-8 pb-4 max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-line/40 select-none w-full">
          <div>
            <h2 className="text-xs uppercase tracking-[0.25em] text-ember font-semibold flex items-center gap-2">
              {category ? (
                <>
                  Topic <span className="text-foreground/40">/</span> {category}
                </>
              ) : (
                "All Dispatches"
              )}
            </h2>
            <p className="text-[10px] text-foreground/45 uppercase tracking-[0.15em] mt-1 font-light">
              {isLoggedIn || filteredArticles.length <= 3
                ? `Showing ${visibleArticles.length} matching piece${visibleArticles.length === 1 ? "" : "s"}`
                : `Showing top ${visibleArticles.length} matching piece${visibleArticles.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/35" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dispatches by title, author, or category..."
              className="w-full bg-ink border border-line rounded-lg pl-12 pr-5 py-3.5 text-xs tracking-wider focus:outline-none focus:border-ember text-foreground placeholder:text-foreground/20"
            />
          </div>
        </section>

        {/* Topic Pill Selector */}
        <section className="px-6 md:px-12 lg:px-20 pt-6 max-w-7xl mx-auto w-full select-none">
          <div className="flex flex-wrap gap-2.5 items-center">
            {[
              "All",
              "AI",
              "Technology",
              "Science",
              "Politics",
              "Startups",
              "Lifestyle",
              "General",
            ].map((cat) => {
              const isActive =
                (!category && cat === "All") || category?.toLowerCase() === cat.toLowerCase();
              return (
                <Link
                  key={cat}
                  to="/feed"
                  search={{ category: cat === "All" ? undefined : cat } as any}
                  className={`px-4 py-2 text-[10px] uppercase tracking-[0.25em] font-semibold border transition-all ${
                    isActive
                      ? "bg-ember border-ember text-ink"
                      : "border-line text-foreground/65 hover:border-ember/40 hover:text-foreground"
                  }`}
                >
                  {cat}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Blinking Sign In Cue for Logged Out Users */}
        {!isLoggedIn && (
          <section className="px-6 md:px-12 lg:px-20 pt-6 max-w-7xl mx-auto w-full select-none">
            <div className="inline-flex border border-ember/25 bg-ember/5 px-3 py-2 items-center gap-2 rounded-md">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ember opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-ember"></span>
              </span>
              <p className="text-[9px] md:text-[10px] uppercase tracking-[0.15em] text-foreground/75 font-medium leading-normal">
                Viewing 3 free dispatches.{" "}
                <Link
                  to="/login"
                  className="text-ember underline underline-offset-2 font-semibold hover:text-paper transition-colors"
                >
                  Sign in
                </Link>{" "}
                or{" "}
                <Link
                  to="/register"
                  className="text-ember underline underline-offset-2 font-semibold hover:text-paper transition-colors"
                >
                  create an account
                </Link>{" "}
                to view all.
              </p>
            </div>
          </section>
        )}

        {/* Asymmetric Article Grid */}
        <section className="px-6 md:px-12 lg:px-20 pt-10 pb-20 max-w-7xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <span className="text-xs uppercase tracking-[0.2em] text-foreground/40 font-serif italic animate-pulse">
                Loading the spread...
              </span>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="py-20 text-center select-none">
              <span className="text-xs uppercase tracking-[0.2em] text-foreground/45 font-serif italic">
                No matching dispatches found.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-y-20 gap-x-12">
              {visibleArticles.map((article, idx) => {
                // Alternating wide layout sizes for editorial rhythm
                const gridSpan =
                  idx % 3 === 0 ? "md:col-span-12 lg:col-span-8" : "md:col-span-6 lg:col-span-4";

                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, delay: (idx % 3) * 0.1 }}
                    className={`${gridSpan} group border border-line bg-card/25 hover:bg-card/45 p-8 transition-all duration-500 flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex justify-between items-center border-b border-line pb-4 mb-6">
                        <span className="text-xs uppercase tracking-[0.2em] text-ember font-medium">
                          {article.category}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                          {new Date(article.published_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <h3 className="font-serif text-3xl md:text-4xl text-foreground group-hover:text-ember transition-colors duration-300 mb-6">
                        {article.title}
                      </h3>

                      <p className="text-sm md:text-base text-foreground/60 leading-relaxed font-light line-clamp-3 mb-8">
                        {article.body_text}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center justify-between border-t border-line/60 pt-6 mt-auto">
                      <span className="text-xs text-foreground/40 italic">By {article.author}</span>

                      <div className="flex gap-4">
                        <Link
                          to="/reader/$articleId"
                          params={{ articleId: article.id }}
                          className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-foreground/80 hover:text-ember transition-colors"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          Read
                        </Link>
                        <Link
                          to="/chat"
                          search={{ article_id: article.id }}
                          className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-foreground/80 hover:text-ember transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Ask AI
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Locked Feed Paywall Card */}
              {!isLoggedIn && filteredArticles.length > 3 && (
                <div className="col-span-12 border border-line bg-card/10 backdrop-blur-sm p-10 md:p-16 text-center rounded-lg space-y-6 relative overflow-hidden mt-12 hover:border-ember/25 transition-all select-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-24 bg-ember" />
                  <p className="text-ember font-medium tracking-[0.25em] uppercase text-xs font-semibold">
                    Unlock the spread
                  </p>
                  <h3 className="font-serif italic text-3xl md:text-5xl max-w-2xl mx-auto leading-tight text-foreground">
                    Unlock the entire daily <span className="text-ember">spread.</span>
                  </h3>
                  <p className="text-sm md:text-base text-foreground/50 max-w-xl mx-auto leading-relaxed font-light">
                    Lumen features a curated selection of journalism. To search beyond the first
                    three dispatches, access RAG feed chat, or view complete logs, join our reading
                    sanctuary.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                    <Link
                      to="/register"
                      className="px-8 py-4 bg-ember text-ink font-semibold text-xs tracking-[0.2em] uppercase hover:bg-paper transition-all cursor-pointer"
                    >
                      Create Free Account
                    </Link>
                    <Link
                      to="/login"
                      className="px-8 py-4 border border-line text-xs tracking-[0.2em] uppercase hover:bg-card transition-all cursor-pointer"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
