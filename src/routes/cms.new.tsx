import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import {
  ArrowLeft,
  FileText,
  Image,
  Upload,
  X,
  RefreshCw,
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

export const Route = createFileRoute("/cms/new")({
  head: () => ({
    meta: [
      { title: "Composer — Lumen" },
      { name: "description", content: "Compose dispatches and attach articles." },
    ],
  }),
  component: CmsNewPage,
});

const CATEGORIES = ["AI", "Science", "Politics", "Startups", "Lifestyle", "Technology"];

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  url: string;
}

function CmsNewPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("AI");
  const [bodyText, setBodyText] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [editorWidth, setEditorWidth] = useState(70);
  const isDragging = useRef(false);
  const layoutRef = useRef<HTMLFormElement>(null);

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
      // Prefix every selected line (or current line if no selection)
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
    // Restore focus + selection after React re-render
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
    null, // divider
    { icon: Heading1, label: "Heading 1", action: () => applyFormat("# ", "", true) },
    { icon: Heading2, label: "Heading 2", action: () => applyFormat("## ", "", true) },
    { icon: Quote, label: "Blockquote", action: () => applyFormat("> ", "", true) },
    null, // divider
    { icon: List, label: "Bullet list", action: () => applyFormat("- ", "", true) },
    { icon: ListOrdered, label: "Numbered list", action: () => applyFormat("1. ", "", true) },
    { icon: Minus, label: "Divider", action: () => insertAtCursor("\n---\n") },
  ] as const;

  const [session, setSession] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // Route guard: check editor role
  useEffect(() => {
    setMounted(true);
    const s = auth.getSession();
    setSession(s);
    if (!s || s.role !== "editor") {
      toast.error("Access restricted to Editors.");
      navigate({ to: "/login" });
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !layoutRef.current) return;

      const rect = layoutRef.current.getBoundingClientRect();

      let percent = ((e.clientX - rect.left) / rect.width) * 100;

      percent = Math.max(50, Math.min(85, percent));

      setEditorWidth(percent);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);
  useEffect(() => {
    const saved = localStorage.getItem("cms-editor-width");
    if (saved) {
      setEditorWidth(Number(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cms-editor-width", editorWidth.toString());
  }, [editorWidth]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // Simulate file upload API call
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_URL}/api/cms/upload`, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error();

        const data = await response.json();

        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            type: file.type,
            url: data.url, // returned image resolution key (ai/space/city)
          },
        ]);
      }
      toast.success("Attachment uploaded successfully.");
    } catch {
      toast.error("Failed to upload attachment.");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !bodyText.trim()) {
      toast.error("Please provide both title and body text.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/cms/articles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body_text: bodyText,
          category,
          author: session?.name || "Lumen Editor",
          editor_id: session?.userId || "mock-editor-id",
          attachments: attachments.map((a) => ({ name: a.name, url: a.url })),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to submit dispatch.");
      }

      toast.success("Dispatch submitted successfully! Ingestion queued.");
      navigate({ to: "/cms" });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit dispatch. Ensure backend server is running.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!mounted || !session || session.role !== "editor") {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col justify-between">
      <div className="grain-overlay" />
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-6 md:px-12 lg:px-20 max-w-5xl mx-auto w-full relative z-10">
        <Link
          to="/cms"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-foreground/45 hover:text-ember transition-colors mb-12"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Dashboard
        </Link>

        {/* Editorial styled header */}
        <section className="border-b border-line pb-8 mb-16">
          <p className="text-ember font-medium tracking-[0.25em] uppercase text-xs mb-4">
            New Composition
          </p>
          <h1 className="font-serif leading-[0.95] text-5xl md:text-6xl text-foreground">
            Writer <span className="italic text-ember">Workspace.</span>
          </h1>
          <p className="mt-4 text-sm text-foreground/50 font-light leading-relaxed">
            Compose your text, choose a category, and attach files or reference photos. Once
            submitted, Lumen's multi-AI-agent pipeline automatically summaries and embeds the text.
          </p>
        </section>

        <form ref={layoutRef} onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-0">
          {/* Main Content Area */}
          <div
            className="space-y-6"
            style={{
              width: window.innerWidth >= 1024 ? `${editorWidth}%` : "100%",
            }}
          >
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
                placeholder="Begin writing your dispatch here. Focus on depth, insight, and clarity..."
                required
                rows={14}
                className="w-full bg-transparent border-0 text-base md:text-lg text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:ring-0 resize-y leading-relaxed font-light px-4 py-4"
                disabled={submitting}
              />

              {/* Word / char count */}
              <div className="px-4 py-2 border-t border-line/60 text-right text-[10px] text-foreground/30 font-light">
                {bodyText.split(/\s+/).filter(Boolean).length} words · {bodyText.length} characters
              </div>
            </div>
          </div>
          <div
            className="
    hidden lg:flex
    w-4
    cursor-col-resize
    items-center
    justify-center
    group
    flex-shrink-0
  "
            onMouseDown={() => {
              isDragging.current = true;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
          >
            <div
              className="
      h-full
      w-px
      bg-line
      group-hover:bg-ember
      transition-colors
    "
            />
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8 flex-1 min-w-[280px] pl-6">
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

            {/* Attachments Area */}
            <div className="border border-line p-6 bg-card/10 rounded-lg space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] text-ember font-semibold">
                Attachments
              </h3>

              {/* Drag and Drop Box */}
              <div className="border border-dashed border-line p-6 text-center hover:border-ember/40 transition-colors relative cursor-pointer group">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading || submitting}
                />
                <Upload className="h-6 w-6 text-foreground/40 mx-auto mb-2 group-hover:text-ember transition-colors" />
                <p className="text-[10px] uppercase tracking-[0.15em] text-foreground/60 mb-1">
                  Upload files & photos
                </p>
                <p className="text-[8px] text-foreground/35">PDF, PNG, JPG up to 10MB</p>
              </div>

              {/* Uploading indicator */}
              {uploading && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <RefreshCw className="h-3 w-3 text-ember animate-spin" />
                  <span className="text-[9px] uppercase tracking-wider text-foreground/50 animate-pulse">
                    Uploading files...
                  </span>
                </div>
              )}

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="space-y-2 border-t border-line/60 pt-4">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 border border-line bg-ink/50 text-[10px]"
                    >
                      <div className="flex items-center gap-2 max-w-[80%]">
                        {file.type.startsWith("image/") ? (
                          <Image className="h-3.5 w-3.5 text-ember shrink-0" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 text-foreground/45 shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="text-foreground/80 font-medium truncate">{file.name}</p>
                          <p className="text-foreground/35 text-[8px]">{formatBytes(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="p-1 text-foreground/35 hover:text-destructive transition-colors"
                        disabled={submitting}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submission triggers */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-ember text-ink text-xs tracking-[0.2em] uppercase font-semibold hover:bg-paper active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {submitting ? "Publishing Dispatch..." : "Publish Dispatch"}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
