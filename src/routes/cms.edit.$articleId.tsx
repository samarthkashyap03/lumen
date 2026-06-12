import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Trash2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Quote,
  List,
  ListOrdered,
  Minus,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";

export const Route = createFileRoute("/cms/edit/$articleId")({
  head: () => ({
    meta: [
      { title: "Edit Dispatch — Lumen" },
      { name: "description", content: "Modify and re-compile your published dispatch." },
    ],
  }),
  component: CmsEditPage,
});

const CATEGORIES = ["AI", "Science", "Politics", "Startups", "Lifestyle", "Technology"];

function CmsEditPage() {
  const { articleId } = Route.useParams();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("AI");
  const [bodyText, setBodyText] = useState("");
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Wraps the current selection with a prefix+suffix, or prefixes each line. */
  const applyFormat = (prefix: string, suffix = "", linePrefix = false) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = bodyText.slice(start, end);
    let newText: string;
    let newCursorStart: number;
    let newCursorEnd: number;

    if (linePrefix) {
      const lines = selected ? selected.split("\n") : [""];
      const formatted = lines.map((l) => `${prefix}${l}`).join("\n");
      newText = bodyText.slice(0, start) + formatted + bodyText.slice(end);
      newCursorStart = start;
      newCursorEnd = start + formatted.length;
    } else {
      const placeholder = selected || "text";
      const wrapped = `${prefix}${placeholder}${suffix}`;
      newText = bodyText.slice(0, start) + wrapped + bodyText.slice(end);
      newCursorStart = start + prefix.length;
      newCursorEnd = newCursorStart + placeholder.length;
    }

    setBodyText(newText);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newCursorStart, newCursorEnd);
    });
  };

  const insertAtCursor = (snippet: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const newText = bodyText.slice(0, start) + snippet + bodyText.slice(start);
    setBodyText(newText);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  };

  const TOOLBAR_TOOLS = [
    { icon: Bold, label: "Bold", action: () => applyFormat("**", "**") },
    { icon: Italic, label: "Italic", action: () => applyFormat("*", "*") },
    { icon: Underline, label: "Underline", action: () => applyFormat("<u>", "</u>") },
    { icon: Strikethrough, label: "Strikethrough", action: () => applyFormat("~~", "~~") },
    { icon: Code, label: "Inline code", action: () => applyFormat("`", "`") },
    null,
    { icon: Heading1, label: "Heading 1", action: () => applyFormat("# ", "", true) },
    { icon: Heading2, label: "Heading 2", action: () => applyFormat("## ", "", true) },
    { icon: Quote, label: "Blockquote", action: () => applyFormat("> ", "", true) },
    null,
    { icon: List, label: "Bullet list", action: () => applyFormat("- ", "", true) },
    { icon: ListOrdered, label: "Numbered list", action: () => applyFormat("1. ", "", true) },
    { icon: Minus, label: "Divider", action: () => insertAtCursor("\n---\n") },
  ] as const;

  // Guard route on mount
  useEffect(() => {
    setMounted(true);
    const s = auth.getSession();
    setSession(s);
    if (!s || (s.role !== "editor" && s.role !== "admin")) {
      toast.error("Access restricted to Editors and Admins.");
      navigate({ to: "/login" });
    }
  }, []);

  // Fetch current article details to pre-populate form
  useEffect(() => {
    if (mounted && session) {
      setLoadingArticle(true);
      fetch(`${API_URL}/api/articles/${articleId}`)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          setTitle(data.title || "");
          setCategory(data.category || "AI");
          setBodyText(data.body_text || "");
        })
        .catch(() => {
          toast.error("Failed to load article details.");
        })
        .finally(() => {
          setLoadingArticle(false);
        });
    }
  }, [mounted, session, articleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !bodyText.trim()) {
      toast.error("Please provide both title and body text.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/cms/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body_text: bodyText,
          category,
          author: session?.name || "Lumen Editor",
          editor_id: session?.userId || "mock-editor-id",
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to update dispatch.");
      }

      toast.success("Dispatch updated successfully! Re-generation started.");
      // Redirect to main CMS desk so they can watch the live 3-Agent steps run visualization!
      navigate({ to: "/cms" });
    } catch (err: any) {
      toast.error(err.message || "Failed to update dispatch. Ensure backend server is running.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || !session || (session.role !== "editor" && session.role !== "admin")) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col justify-between">
      <div className="grain-overlay" />
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-6 md:px-12 lg:px-20 max-w-5xl mx-auto w-full relative z-10">
        <Link
          to="/cms/work"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-foreground/45 hover:text-ember transition-colors mb-12"
        >
          <ArrowLeft className="h-3 w-3" /> Back to My Work
        </Link>

        {/* Editorial styled header */}
        <section className="border-b border-line pb-8 mb-16">
          <p className="text-ember font-medium tracking-[0.25em] uppercase text-xs mb-4">
            Edit Dispatch
          </p>
          <h1 className="font-serif leading-[0.95] text-5xl md:text-6xl text-foreground">
            Writer <span className="italic text-ember">Desk.</span>
          </h1>
          <p className="mt-4 text-sm text-foreground/50 font-light leading-relaxed">
            Modify title, category, or body content. Saving changes updates the RAG database index
            immediately and prompts the Multi-AI pipeline to re-compile the cards.
          </p>
        </section>

        {loadingArticle ? (
          <div className="py-20 text-center">
            <RefreshCw className="h-6 w-6 text-ember animate-spin mx-auto mb-4" />
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/45 font-serif italic animate-pulse">
              Loading dispatch draft...
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-6">
              {/* Title */}
              <div className="space-y-2 border-b border-line pb-6">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title of your dispatch..."
                  required
                  className="w-full bg-transparent border-0 text-3xl md:text-4xl font-serif text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-0"
                  disabled={submitting}
                />
              </div>

              {/* Body Text Editor */}
              <div className="border border-line rounded-lg overflow-hidden bg-card/5 hover:border-ember/20 focus-within:border-ember/30 transition-colors">
                {/* Formatting Toolbar */}
                <div className="flex items-center gap-0.5 px-3 py-2 border-b border-line bg-ink/40 flex-wrap">
                  {TOOLBAR_TOOLS.map((tool, idx) =>
                    tool === null ? (
                      <span key={`div-${idx}`} className="w-px h-4 bg-line mx-1.5 shrink-0" />
                    ) : (
                      <button
                        key={tool.label}
                        type="button"
                        title={tool.label}
                        onClick={tool.action}
                        disabled={submitting}
                        className="p-1.5 rounded text-foreground/45 hover:text-foreground hover:bg-card/40 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default"
                      >
                        <tool.icon className="h-3.5 w-3.5" />
                      </button>
                    ),
                  )}
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="Begin writing your dispatch here..."
                  required
                  rows={14}
                  className="w-full bg-transparent border-0 text-base md:text-lg text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:ring-0 resize-y leading-relaxed font-light px-4 py-4"
                  disabled={submitting}
                />

                {/* Word / char count */}
                <div className="px-4 py-2 border-t border-line/60 text-right text-[10px] text-foreground/30 font-light">
                  {bodyText.split(/\s+/).filter(Boolean).length} words · {bodyText.length}{" "}
                  characters
                </div>
              </div>
            </div>

            {/* Sidebar Area */}
            <div className="lg:col-span-4 space-y-8">
              {/* Category selection */}
              <div className="border border-line p-6 bg-card/10 rounded-lg space-y-4">
                <h3 className="text-xs uppercase tracking-[0.2em] text-ember font-semibold">
                  Details
                </h3>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-ink border border-line p-3 text-xs uppercase tracking-[0.1em] text-foreground focus:outline-none focus:border-ember"
                    disabled={submitting}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submission triggers */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-ember text-ink text-xs tracking-[0.2em] uppercase font-semibold hover:bg-paper active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save & Re-compile
                  </>
                )}
              </button>

              <Link
                to="/cms/work"
                className="w-full py-3.5 border border-line hover:border-foreground/30 text-foreground/60 hover:text-foreground text-xs tracking-[0.2em] uppercase font-medium transition-all flex items-center justify-center"
              >
                Cancel Changes
              </Link>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
