import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ArrowLeft, MessageSquare, ChevronLeft, ChevronRight, Keyboard, Move } from "lucide-react";
import cardAi from "@/assets/card-ai.jpg";
import cardCity from "@/assets/card-city.jpg";
import cardSpace from "@/assets/card-space.jpg";
import { toast } from "sonner";
import { trackEvent } from "@/lib/trackEvent";
import { auth } from "@/lib/auth";
import { API_URL } from "@/lib/config";

export const Route = createFileRoute("/reader/$articleId")({
  head: () => ({
    meta: [
      { title: "Reader — Lumen" },
      { name: "description", content: "Deep reading mode with interactive swipe dispatches." },
    ],
  }),
  component: ReaderPage,
});

type SwipeCard = {
  id: string;
  card_index: number;
  category: string;
  title: string;
  summary: string;
  image_url: string;
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

const resolveCardImage = (key: string) => {
  if (key === "ai") return cardAi;
  if (key === "city") return cardCity;
  if (key === "space") return cardSpace;
  return cardAi;
};

function ReaderPage() {
  const { articleId } = Route.useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isTakingLong, setIsTakingLong] = useState(false);
  const navigate = useNavigate();
  const enteredAt = useRef<number>(Date.now());

  useEffect(() => {
    setIsLoggedIn(auth.isAuthenticated());
  }, []);

  // Load feed queue to identify next/prev articles
  useEffect(() => {
    fetch(`${API_URL}/api/articles`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setArticles(data);
      })
      .catch(() => {
        // Fallback mock feed
        setArticles([
          {
            id: articleId,
            title: "Neural models now reason in real time.",
            author: "Elena Rostova",
            category: "AI",
            body_text: "Artificial intelligence has undergone a fundamental architectural shift...",
            published_at: new Date().toISOString(),
          },
        ]);
      });
  }, [articleId]);

  // Load current article details
  useEffect(() => {
    setLoading(true);
    setIsTakingLong(false);

    const timer = setTimeout(() => {
      setIsTakingLong(true);
    }, 4500);

    const fallbackArticle = {
      id: articleId,
      title: "Neural models now reason in real time.",
      author: "Elena Rostova",
      category: "AI",
      body_text:
        "Artificial intelligence has undergone a fundamental architectural shift. By introducing compressed semantic trees, next-generation reasoning networks are capable of generating complete multi-step logical layouts within milliseconds.\n\nThis represents a massive departure from typical autoregressive prompt queries. Traditional large language models generate tokens step-by-step in sequence, inducing high computing latency. Real-time models pre-evaluate potential pathways in parallel clusters, caching token hierarchies before output execution starts.\n\nThe practical applications are immediate. Interactive voice interfaces feel conversational rather than rigid, adjusting emphasis dynamically to coordinate with human speech beats. Researchers anticipate this level of throughput will redefine consumer agents in the coming year, shifting focus from pure computational parameters to sensory latency boundaries.",
      published_at: new Date().toISOString(),
      cards: [
        {
          id: "c1",
          card_index: 0,
          category: "AI",
          title: "Neural models reason in *real time*",
          summary:
            "A new reasoning architecture compresses critical semantic trees into milliseconds. Assistants can pre-plan answers in parallel prior to typing outputs.",
          image_url: "ai",
        },
        {
          id: "c2",
          card_index: 1,
          category: "AI",
          title: "Shifting away from *autoregression*",
          summary:
            "Traditional sequential processing induces high latency boundaries. Parallel computing tracks cache entire hierarchies, allowing immediate response rates.",
          image_url: "space",
        },
        {
          id: "c3",
          card_index: 2,
          category: "AI",
          title: "Redefining user *interaction*",
          summary:
            "Practical consumer voice loops adapt to real conversation dynamics. Focus moves from raw cluster size to absolute sensory response speeds.",
          image_url: "city",
        },
      ],
    };

    fetch(`${API_URL}/api/articles/${articleId}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        clearTimeout(timer);
        setArticle(data);
        setActiveCardIdx(0);
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timer);
        setArticle(fallbackArticle);
        setActiveCardIdx(0);
        setLoading(false);
      });

    return () => clearTimeout(timer);
  }, [articleId]);

  const loadMockPreview = () => {
    const fallbackArticle = {
      id: articleId,
      title: "Neural models now reason in real time.",
      author: "Elena Rostova",
      category: "AI",
      body_text:
        "Artificial intelligence has undergone a fundamental architectural shift. By introducing compressed semantic trees, next-generation reasoning networks are capable of generating complete multi-step logical layouts within milliseconds.\n\nThis represents a massive departure from typical autoregressive prompt queries. Traditional large language models generate tokens step-by-step in sequence, inducing high computing latency. Real-time models pre-evaluate potential pathways in parallel clusters, caching token hierarchies before output execution starts.\n\nThe practical applications are immediate. Interactive voice interfaces feel conversational rather than rigid, adjusting emphasis dynamically to coordinate with human speech beats. Researchers anticipate this level of throughput will redefine consumer agents in the coming year, shifting focus from pure computational parameters to sensory latency boundaries.",
      published_at: new Date().toISOString(),
      cards: [
        {
          id: "c1",
          card_index: 0,
          category: "AI",
          title: "Neural models reason in *real time*",
          summary:
            "A new reasoning architecture compresses critical semantic trees into milliseconds. Assistants can pre-plan answers in parallel prior to typing outputs.",
          image_url: "ai",
        },
        {
          id: "c2",
          card_index: 1,
          category: "AI",
          title: "Shifting away from *autoregression*",
          summary:
            "Traditional sequential processing induces high latency boundaries. Parallel computing tracks cache entire hierarchies, allowing immediate response rates.",
          image_url: "space",
        },
        {
          id: "c3",
          card_index: 2,
          category: "AI",
          title: "Redefining user *interaction*",
          summary:
            "Practical consumer voice loops adapt to real conversation dynamics. Focus moves from raw cluster size to absolute sensory response speeds.",
          image_url: "city",
        },
      ],
    };
    setArticle(fallbackArticle);
    setActiveCardIdx(0);
    setLoading(false);
  };

  // Track view + dwell_time on mount/unmount
  useEffect(() => {
    if (!articleId) return;
    enteredAt.current = Date.now();
    trackEvent("view", articleId);
    return () => {
      const seconds = Math.round((Date.now() - enteredAt.current) / 1000);
      trackEvent("dwell_time", articleId, { seconds });
    };
  }, [articleId]);

  // Find next/prev article IDs
  const currentIdx = articles.findIndex((art) => art.id === articleId);
  const prevArticleId = currentIdx > 0 ? articles[currentIdx - 1].id : null;
  const nextArticleId =
    currentIdx < articles.length - 1 && currentIdx !== -1 ? articles[currentIdx + 1].id : null;

  const handleNextCard = () => {
    if (article?.cards && activeCardIdx < article.cards.length - 1) {
      const nextIdx = activeCardIdx + 1;
      setActiveCardIdx(nextIdx);
      trackEvent("swipe", articleId, { direction: "forward", card_index: nextIdx });
    }
  };

  const handlePrevCard = () => {
    if (activeCardIdx > 0) {
      const nextIdx = activeCardIdx - 1;
      setActiveCardIdx(nextIdx);
      trackEvent("swipe", articleId, { direction: "back", card_index: nextIdx });
    }
  };

  const handleNextArticle = () => {
    if (nextArticleId) {
      toast.info("Navigating to next dispatch...");
      navigate({ to: "/reader/$articleId", params: { articleId: nextArticleId } });
    } else {
      toast.info("You have reached the end of the feed spread.");
    }
  };

  const handlePrevArticle = () => {
    if (prevArticleId) {
      toast.info("Navigating to previous dispatch...");
      navigate({ to: "/reader/$articleId", params: { articleId: prevArticleId } });
    } else {
      toast.info("This is the newest dispatch in the spread.");
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevCard();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextCard();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handlePrevArticle();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleNextArticle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [articles, article, activeCardIdx]);

  if (loading || !article) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-foreground/40 font-serif italic animate-pulse mb-6">
          Entering reading sanctuary...
        </span>
        {isTakingLong && (
          <div className="flex flex-col items-center gap-4 opacity-0 animate-in fade-in duration-1000">
            <p className="text-[10px] uppercase tracking-[0.15em] text-foreground/30 max-w-xs">
              Backend might be waking up from a cold start, or connection is slow.
            </p>
            <button
              onClick={loadMockPreview}
              className="px-6 py-3 border border-line text-[10px] uppercase tracking-[0.2em] hover:bg-card hover:border-ember/40 transition-colors text-foreground/70 hover:text-foreground"
            >
              Force Load Offline Preview
            </button>
          </div>
        )}
      </div>
    );
  }
  const cards = article.cards || [];
  const activeCard = cards[activeCardIdx];
  const paragraphs = article.body_text.split("\n\n");
  const isGated = !isLoggedIn && currentIdx !== -1 && currentIdx >= 3;

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden flex flex-col justify-between">
      <div className="grain-overlay" />
      <Navbar />

      {isGated ? (
        <main className="flex-1 pt-32 pb-24 px-6 md:px-12 lg:px-20 max-w-5xl mx-auto w-full relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12 select-none">
            <Link
              to="/feed"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-foreground/45 hover:text-ember transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Feed
            </Link>
          </div>

          {/* Hero Header Section Gated View */}
          <section className="border-b border-line pb-12 mb-16 select-none">
            <p className="text-ember text-xs uppercase tracking-[0.25em] font-semibold mb-6">
              Dispatch / {article.category}
            </p>
            <h1 className="font-serif leading-[0.95] text-[clamp(2.5rem,6vw,5.5rem)] max-w-5xl text-foreground/40 select-none blur-[2px]">
              {article.title.replace(/\*(.*?)\*/g, "$1")}
              <span className="italic text-ember">.</span>
            </h1>
            <div className="mt-8 flex justify-between items-center text-xs text-foreground/30">
              <span>By {article.author}</span>
              <span>
                {new Date(article.published_at).toLocaleDateString("en-US", {
                  dateStyle: "medium",
                })}
              </span>
            </div>
          </section>

          {/* Paywall Gate */}
          <div className="max-w-2xl mx-auto border border-line bg-card/10 p-10 md:p-16 rounded-xl text-center space-y-6 relative overflow-hidden hover:border-ember/25 transition-all select-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-24 bg-ember" />
            <p className="text-ember font-medium tracking-[0.25em] uppercase text-xs font-semibold">
              Premium Dispatch
            </p>
            <h3 className="font-serif italic text-3xl md:text-5xl leading-tight text-foreground">
              Unlock this story and the <span className="text-ember">entire archive.</span>
            </h3>
            <p className="text-sm md:text-base text-foreground/50 leading-relaxed font-light">
              You've reached the limit of free dispatches. Sign up or log in to read the full
              article, swipe the summary cards, and ask the AI feed target questions.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                to="/register"
                className="px-8 py-4 bg-ember text-ink font-semibold text-xs tracking-[0.2em] uppercase hover:bg-paper transition-all cursor-pointer animate-none"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 border border-line text-xs tracking-[0.2em] uppercase hover:bg-card transition-all cursor-pointer animate-none"
              >
                Sign In
              </Link>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 pt-32 pb-24 px-6 md:px-12 lg:px-20 max-w-[1440px] mx-auto w-full relative z-10">
          {/* Nav and shortcuts guide */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
            <Link
              to="/feed"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-foreground/45 hover:text-ember transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Feed
            </Link>

            <div className="hidden lg:flex items-center gap-6 text-[9px] uppercase tracking-[0.15em] text-foreground/40 font-light">
              <span className="flex items-center gap-1.5 border border-line px-2 py-1 bg-ink/40">
                <Keyboard className="h-3.5 w-3.5" /> Arrow Keys Enabled
              </span>
              <span className="flex items-center gap-1.5 border border-line px-2 py-1 bg-ink/40">
                <Move className="h-3.5 w-3.5" /> Swipe Gestures Active
              </span>
              <span>Up/Down: Articles | Left/Right: Cards</span>
            </div>
          </div>

          {/* Global Immersive Vertical Drag Wrapper */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={(e, info) => {
              if (info.offset.y < -140) {
                handleNextArticle();
              } else if (info.offset.y > 140) {
                handlePrevArticle();
              }
            }}
            className="cursor-ns-resize"
          >
            {/* Hero Header Section */}
            <section className="border-b border-line pb-12 mb-16 select-none">
              <p className="text-ember text-xs uppercase tracking-[0.25em] font-semibold mb-6">
                Dispatch / {article.category}
              </p>
              <h1 className="font-serif leading-[0.95] text-[clamp(2.5rem,6vw,5.5rem)] max-w-5xl">
                {article.title.replace(/\*(.*?)\*/g, "$1")}
                <span className="italic text-ember">.</span>
              </h1>

              {/* Elegant Pill Toggle Switch - Moved up above fold */}
              <div className="mt-12 flex justify-start select-none">
                <div className="inline-flex bg-card/25 border border-line p-1 rounded-full relative">
                  <button
                    onClick={() => setShowOriginal(false)}
                    className={`relative px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] rounded-full transition-all duration-300 cursor-pointer ${
                      !showOriginal
                        ? "text-ink bg-ember"
                        : "text-foreground/50 hover:text-foreground bg-transparent"
                    }`}
                  >
                    AI Digest Cards
                  </button>
                  <button
                    onClick={() => {
                      setShowOriginal(true);
                      if (!showOriginal) trackEvent("read", articleId);
                    }}
                    className={`relative px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] rounded-full transition-all duration-300 cursor-pointer ${
                      showOriginal
                        ? "text-ink bg-ember"
                        : "text-foreground/50 hover:text-foreground bg-transparent"
                    }`}
                  >
                    Original Article
                  </button>
                </div>
              </div>

              <div className="mt-10 flex justify-between items-center text-xs text-foreground/50">
                <span>By {article.author}</span>
                <span>
                  {new Date(article.published_at).toLocaleDateString("en-US", {
                    dateStyle: "medium",
                  })}
                </span>
              </div>
            </section>

            {/* Conditional Layout based on Toggle Switch */}
            {!showOriginal ? (
              /* Centered Immersive Swipe Cards Mode */
              <div className="max-w-lg mx-auto w-full select-none">
                <div className="bg-card/10 border border-line p-8 rounded-lg">
                  <div className="flex justify-between items-center border-b border-line pb-4 mb-8">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-ember font-semibold">
                      Lumen dispatches
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">
                      {activeCardIdx + 1} of {cards.length}
                    </span>
                  </div>

                  {/* Horizontal Drag Card Container */}
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.4}
                    onDragEnd={(e, info) => {
                      if (info.offset.x < -80) {
                        handleNextCard();
                      } else if (info.offset.x > 80) {
                        handlePrevCard();
                      }
                    }}
                    className="cursor-ew-resize relative h-[440px] w-full bg-ink border border-line rounded-xl overflow-hidden shadow-2xl mb-6 group transition-all hover:border-ember/20"
                  >
                    <AnimatePresence mode="wait">
                      {activeCard && (
                        <motion.div
                          key={activeCard.card_index}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.35, ease: "easeInOut" }}
                          className="absolute inset-0 flex flex-col justify-between"
                        >
                          {/* Image Top Half */}
                          <div className="relative h-1/2 w-full overflow-hidden">
                            <img
                              src={resolveCardImage(activeCard.image_url)}
                              alt="dispatch context"
                              className="h-full w-full object-cover grayscale opacity-60 group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                            <div className="absolute top-4 left-4 text-[9px] uppercase tracking-[0.25em] text-ember font-semibold">
                              {activeCard.category}
                            </div>
                          </div>

                          {/* Content Bottom Half */}
                          <div className="p-6 flex flex-col justify-between h-1/2 bg-ink">
                            <div>
                              <div className="h-px w-8 bg-ember mb-3" />
                              <h3 className="font-serif text-lg leading-tight text-foreground mb-3">
                                {activeCard.title.split("*").map((t, idx) =>
                                  idx % 2 !== 0 ? (
                                    <em key={idx} className="italic text-ember font-normal">
                                      {t}
                                    </em>
                                  ) : (
                                    t
                                  ),
                                )}
                              </h3>
                              <p className="text-[11px] leading-relaxed text-foreground/60 font-light">
                                {activeCard.summary.split("*").map((t, idx) =>
                                  idx % 2 !== 0 ? (
                                    <em key={idx} className="italic text-ember font-normal">
                                      {t}
                                    </em>
                                  ) : (
                                    t
                                  ),
                                )}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Card slider controls */}
                  <div className="flex justify-between items-center mb-8">
                    <button
                      onClick={handlePrevCard}
                      disabled={activeCardIdx === 0}
                      className="p-2 border border-line hover:bg-card/40 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer text-foreground/60 hover:text-foreground animate-none"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex gap-1.5">
                      {cards.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveCardIdx(idx)}
                          className={`h-1.5 w-1.5 rounded-full transition-all ${idx === activeCardIdx ? "bg-ember w-4" : "bg-line"}`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={handleNextCard}
                      disabled={activeCardIdx === cards.length - 1}
                      className="p-2 border border-line hover:bg-card/40 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer text-foreground/60 hover:text-foreground animate-none"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* RAG Chat Prompt */}
                  <div className="border-t border-line/60 pt-6">
                    <Link
                      to="/chat"
                      search={{ article_id: article.id }}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-ember text-ink text-xs uppercase tracking-[0.2em] font-semibold hover:bg-paper transition-all"
                    >
                      <MessageSquare className="h-4 w-4" /> Ask AI about this dispatch
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* Clean Single-Column Editorial Mode */
              <div className="max-w-3xl mx-auto w-full select-text pb-12 space-y-12 animate-none">
                <article className="space-y-8">
                  {paragraphs.map((p, idx) => (
                    <p
                      key={idx}
                      className="text-lg md:text-xl text-foreground/75 leading-relaxed font-light first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:text-ember first-letter:leading-none"
                    >
                      {p.split("**").map((text, i) => {
                        const isBold = i % 2 !== 0;
                        return text.split("*").map((subText, j) => {
                          const isItalic = j % 2 !== 0;
                          if (isBold) return <strong key={`${i}-${j}`}>{subText}</strong>;
                          if (isItalic)
                            return (
                              <em key={`${i}-${j}`} className="italic text-ember">
                                {subText}
                              </em>
                            );
                          return subText;
                        });
                      })}
                    </p>
                  ))}
                </article>

                {/* RAG Chat Prompt for Original Text */}
                <div className="border-t border-line/60 pt-8 max-w-xl mx-auto">
                  <Link
                    to="/chat"
                    search={{ article_id: article.id }}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-ember text-ink text-xs uppercase tracking-[0.2em] font-semibold hover:bg-paper transition-all"
                  >
                    <MessageSquare className="h-4 w-4" /> Ask AI about this article
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      )}

      <Footer />
    </div>
  );
}
