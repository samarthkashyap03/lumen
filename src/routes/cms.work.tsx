import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import {
  Eye,
  Edit3,
  Trash2,
  Calendar,
  FileText,
  Search,
  Plus,
  AlertCircle,
  RefreshCw,
  Share2,
  Check,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/cms/work")({
  head: () => ({
    meta: [
      { title: "My Work — Lumen" },
      { name: "description", content: "Manage your composed and ingested dispatches." },
    ],
  }),
  component: CmsWorkPage,
});

type ArticleDispatch = {
  id: string;
  url: string;
  title: string;
  category: string;
  status: "processing" | "completed" | "failed";
  created_at: string;
};

function CmsWorkPage() {
  const [articles, setArticles] = useState<ArticleDispatch[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const navigate = useNavigate();

  // Guard route on mount
  useEffect(() => {
    setMounted(true);
    const s = auth.getSession();
    setSession(s);
    if (!s || s.role !== "editor") {
      toast.error("Access restricted to Editors.");
      navigate({ to: "/login" });
    }
  }, []);

  const fetchMyArticles = () => {
    const s = auth.getSession();
    if (!s) return;
    setLoading(true);
    fetch(`${API_URL}/api/cms/my-articles?editor_id=${s.userId}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setArticles(data);
      })
      .catch(() => {
        // Fallback mock work
        setArticles([
          {
            id: "mock-1",
            url: "lumen://dispatches/mock-1",
            title: "Neural models now reason in real time",
            category: "AI",
            status: "completed",
            created_at: new Date().toISOString(),
          },
        ]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (mounted && session) {
      fetchMyArticles();
    }
  }, [mounted, session]);

  const requestDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;

    try {
      const response = await fetch(`${API_URL}/api/cms/articles/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error();

      toast.success("Dispatch deleted successfully.");
      // Update local state list
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Failed to delete dispatch. Please try again.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleEdit = (id: string) => {
    navigate({ to: "/cms/edit/$articleId", params: { articleId: id } });
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShare = async (id: string) => {
    const shareUrl = `${window.location.origin}/reader/${id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(id);
      toast.success("Shareable link copied to clipboard.", {
        description: shareUrl,
      });
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      toast.error("Failed to copy link. Please try again.");
    }
  };

  // Group articles by date
  const getGroupHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }
  };

  // Filter list
  const filteredArticles = articles.filter(
    (art) =>
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Group items by headers
  const groups: { [key: string]: ArticleDispatch[] } = {};
  filteredArticles.forEach((art) => {
    const header = getGroupHeader(art.created_at);
    if (!groups[header]) {
      groups[header] = [];
    }
    groups[header].push(art);
  });

  if (!mounted || !session || session.role !== "editor") {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col justify-between">
      <div className="grain-overlay" />
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto w-full relative z-10">
        {/* Editorial styled dashboard header */}
        <section className="border-b border-line pb-8 mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-ember font-medium tracking-[0.25em] uppercase text-xs mb-4">
              Dashboard
            </p>
            <h1 className="font-serif leading-[0.95] text-5xl md:text-7xl text-foreground">
              My <span className="italic text-ember">Work.</span>
            </h1>
            <p className="mt-4 text-sm text-foreground/50 max-w-xl font-light leading-relaxed">
              Manage your composed dispatches and external ingestion links. You can edit the text to
              re-trigger the Multi-AI publishing pipeline or view the reader results.
            </p>
          </div>

          <Link
            to="/cms/new"
            className="px-7 py-4 bg-ember text-ink hover:bg-paper transition-all cursor-pointer font-medium text-xs tracking-[0.2em] uppercase flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Compose New Dispatch
          </Link>
        </section>

        {/* Search Toolbar */}
        <div className="relative mb-10 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/35" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dispatches by title or category..."
            className="w-full bg-ink border border-line rounded-lg pl-12 pr-5 py-3.5 text-xs tracking-wider focus:outline-none focus:border-ember text-foreground placeholder:text-foreground/20"
          />
        </div>

        {/* Main list */}
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="h-6 w-6 text-ember animate-spin mx-auto mb-4" />
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/45 font-serif italic animate-pulse">
              Loading work files...
            </span>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-line rounded-lg p-10 bg-card/5 max-w-2xl mx-auto">
            <FileText className="h-10 w-10 text-foreground/20 mx-auto mb-4" />
            <h3 className="font-serif text-xl text-foreground mb-2">No dispatches found</h3>
            <p className="text-xs text-foreground/50 max-w-md mx-auto leading-relaxed mb-6 font-light">
              {searchQuery
                ? "No dispatches match your search filters. Try adjusting your query."
                : "You haven't composed or ingested any dispatches yet. Head over to the writer workspace to get started."}
            </p>
            {!searchQuery && (
              <Link
                to="/cms/new"
                className="px-6 py-3 bg-ember text-ink text-xs uppercase tracking-[0.15em] font-medium hover:bg-paper transition-colors"
              >
                Compose First dispatch
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {Object.keys(groups).map((groupHeader) => (
              <div key={groupHeader} className="space-y-4">
                {/* Date Header */}
                <h3 className="text-xs uppercase tracking-[0.2em] text-foreground/40 font-medium flex items-center gap-2 select-none">
                  <Calendar className="h-3.5 w-3.5 text-ember" /> {groupHeader}
                </h3>

                {/* Articles list */}
                <div className="grid grid-cols-1 gap-4">
                  {groups[groupHeader].map((art) => (
                    <div
                      key={art.id}
                      className="border border-line bg-card/10 hover:bg-card/25 p-6 rounded-lg transition-all duration-300 flex flex-col md:flex-row md:items-center gap-6 hover:border-ember/20"
                    >
                      {/* Left side detail */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] uppercase tracking-wider text-ember font-serif italic">
                            {art.category}
                          </span>
                          {art.status === "completed" && (
                            <span className="text-[8px] uppercase tracking-[0.15em] text-ember bg-ember/10 border border-ember/30 px-2 py-0.5 rounded leading-none">
                              Published
                            </span>
                          )}
                          {art.status === "processing" && (
                            <span className="text-[8px] uppercase tracking-[0.15em] text-foreground/60 bg-card/60 border border-line px-2 py-0.5 rounded flex items-center gap-1 leading-none animate-pulse">
                              <RefreshCw className="h-2 w-2 animate-spin" /> Ingestion
                            </span>
                          )}
                          {art.status === "failed" && (
                            <span className="text-[8px] uppercase tracking-[0.15em] text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded flex items-center gap-0.5 leading-none">
                              <AlertCircle className="h-2 w-2" /> Failed
                            </span>
                          )}
                        </div>

                        <h4 className="font-serif text-lg md:text-xl text-foreground font-medium truncate leading-tight">
                          {art.title}
                        </h4>

                        <span className="text-[9px] text-foreground/35 block truncate font-light">
                          {art.url}
                        </span>
                      </div>

                      {/* Right side Actions — responsive wrap */}
                      <div className="flex flex-wrap gap-2 md:gap-3 shrink-0 md:self-center md:ml-auto w-full md:w-auto pt-4 md:pt-0 border-t border-line/50 md:border-t-0 mt-2 md:mt-0">
                        <Link
                          to="/reader/$articleId"
                          params={{ articleId: art.id }}
                          disabled={art.status !== "completed"}
                          className="p-3 border border-line hover:border-ember hover:bg-ember/5 text-foreground/60 hover:text-foreground transition-all flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] font-medium disabled:opacity-35 disabled:hover:border-line disabled:hover:bg-transparent"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Link>

                        <button
                          onClick={() => art.status === "completed" && handleShare(art.id)}
                          title="Copy shareable link"
                          disabled={art.status !== "completed"}
                          className="p-3 border border-line hover:border-ember hover:bg-ember/5 text-foreground/60 hover:text-foreground transition-all cursor-pointer flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] font-medium disabled:opacity-35 disabled:hover:border-line disabled:hover:bg-transparent disabled:cursor-default"
                        >
                          {copiedId === art.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-ember" /> Copied
                            </>
                          ) : (
                            <>
                              <Share2 className="h-3.5 w-3.5" /> Share
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleEdit(art.id)}
                          className="p-3 border border-line hover:border-ember hover:bg-ember/5 text-foreground/60 hover:text-foreground transition-all cursor-pointer flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] font-medium"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </button>

                        <button
                          onClick={() => requestDelete(art.id, art.title)}
                          className="p-3 border border-line hover:border-destructive hover:bg-destructive/5 text-foreground/45 hover:text-destructive transition-all cursor-pointer flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] font-medium"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-ink border border-line/40 rounded-none p-8 max-w-lg overflow-hidden">
          <div className="grain-overlay" />
          <div className="relative z-10">
            <AlertDialogHeader>
              <p className="text-ember font-medium tracking-[0.25em] uppercase text-[10px] text-center mb-2 flex items-center justify-center gap-4">
                <span className="h-px w-6 bg-ember" />
                Destructive Action
                <span className="h-px w-6 bg-ember" />
              </p>
              <AlertDialogTitle className="font-serif italic text-4xl md:text-5xl text-foreground text-center mb-4 leading-none pb-2">
                Are you sure?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base text-foreground/60 text-center font-light leading-relaxed">
                Permanently deleting{" "}
                <span className="text-foreground font-medium">"{deleteTarget?.title}"</span> cannot
                be undone. It will be removed from the platform index.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:justify-center w-full sm:space-x-0">
              <AlertDialogCancel className="mt-0 h-auto rounded-none border border-line text-[10px] uppercase tracking-[0.2em] px-8 py-4 bg-transparent hover:bg-card hover:text-foreground text-foreground/70 font-medium transition-colors w-full sm:w-auto focus:ring-0 focus:ring-offset-0">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="h-auto rounded-none bg-destructive text-destructive-foreground text-[10px] uppercase tracking-[0.2em] px-8 py-4 hover:bg-destructive/90 font-medium transition-colors w-full sm:w-auto focus:ring-0 focus:ring-offset-0"
              >
                Delete Dispatch
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
