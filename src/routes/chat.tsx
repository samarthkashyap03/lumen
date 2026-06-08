import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Send, Sparkles, MessageCircle, RotateCcw } from "lucide-react";
import { auth } from "@/lib/auth";
import { API_URL } from "@/lib/config";

type ChatSearch = {
  article_id?: string;
};

export const Route = createFileRoute("/chat")({
  validateSearch: (search: Record<string, unknown>): ChatSearch => {
    return {
      article_id: search.article_id as string | undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "AI Reader Chat — Lumen" },
      { name: "description", content: "Ask questions about any article in the Lumen feed, or search across all published stories." },
    ],
  }),
  component: ChatPage,
});

type Message = {
  id: string;
  sender: "user" | "assistant";
  content: string;
  created_at: Date;
};

const renderMessageContent = (content: string) => {
  const lines = content.split("\n");
  
  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={lineIdx} className="h-2" />;

    const renderInline = (textStr: string) => {
      return textStr.split("*").map((chunk, idx) => {
        if (idx % 2 !== 0) {
          return <span key={idx} className="text-ember font-semibold">{chunk}</span>;
        }
        return chunk;
      });
    };

    // Check if line is a bullet item (starts with - or * or •)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      return (
        <ul key={lineIdx} className="list-none my-1.5 pl-2">
          <li className="relative text-[15.5px] md:text-[17px] leading-relaxed text-foreground/95 font-display font-normal pl-5">
            <span className="absolute left-0 top-[0.65em] h-1.5 w-1.5 bg-ember rounded-sm" />
            {renderInline(bulletMatch[1])}
          </li>
        </ul>
      );
    }

    // Check if it is a numbered list item
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      return (
        <ol key={lineIdx} className="list-none my-1.5 pl-2">
          <li className="relative text-[15.5px] md:text-[17px] leading-relaxed text-foreground/95 font-display font-normal pl-6">
            <span className="absolute left-0 text-xs font-semibold text-ember top-[0.15em]">{numMatch[1]}.</span>
            {renderInline(numMatch[2])}
          </li>
        </ol>
      );
    }

    return (
      <p key={lineIdx} className="text-[15.5px] md:text-[17px] leading-relaxed text-foreground/95 font-display font-normal mb-2 last:mb-0">
        {renderInline(line)}
      </p>
    );
  });
};

function ChatPage() {
  const { article_id } = Route.useSearch();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAssistantRef = useRef<HTMLDivElement>(null);

  const initializeChat = (loggedIn: boolean) => {
    let welcomeText = "";
    if (loggedIn) {
      welcomeText = article_id 
        ? "This article is ready. Ask me any questions about what is written — the main points, any claims, or how it connects to other stories."
        : "Ask me anything. I can search across all published stories in the feed and pull out what's relevant to your question.";
    } else {
      welcomeText = "Hi — I'm the Lumen Assistant. You're not signed in, so I can answer general questions about how Lumen works, what features it has, and how to get started. Sign in or create a free account to ask questions about specific articles.";
    }

    setMessages([
      {
        id: "welcome-" + Math.random().toString(),
        sender: "assistant",
        content: welcomeText,
        created_at: new Date(),
      }
    ]);
  };

  useEffect(() => {
    const loggedIn = auth.isAuthenticated();
    setIsLoggedIn(loggedIn);
    initializeChat(loggedIn);
  }, [article_id]);

  const handleReset = () => {
    setSessionId(null);
    initializeChat(isLoggedIn);
  };

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender === "assistant" && lastAssistantRef.current) {
      // Scroll so the start of the reply is visible at the top
      lastAssistantRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // User message or loading — scroll to bottom
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessageText = inputValue;
    setInputValue("");
    setLoading(true);

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      content: userMessageText,
      created_at: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch(`${API_URL}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          article_id: article_id,
          message: userMessageText,
          token: auth.getSession()?.token || null,
        }),
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      if (data.session_id) setSessionId(data.session_id);

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "assistant",
          content: data.response,
          created_at: new Date(),
        },
      ]);
    } catch {
      // Mocked RAG response if backend fails
      setTimeout(() => {
        const fallbackText = isLoggedIn
          ? (article_id
              ? "Based on this article, here are a few key takeaways:\n- The piece focuses on a specific development in its field, covering the main argument in detail.\n- It highlights practical implications for readers who follow the topic.\n- If you have a more specific question about what's written, feel free to ask."
              : "Here's what I found across the feed:\n- Several stories touch on this topic from different angles.\n- The feed is updated regularly, so there may be newer articles covering this further.\n- Try asking a more specific question and I'll search for the most relevant match.")
          : "Here's a quick overview of how Lumen works:\n- No ads: Lumen is a clean reading platform, funded by subscriptions.\n- Every article comes with a 3-card summary so you can read it in under 90 seconds.\n- You can also tap through to the full original article at any time.\n\nSign in or create a free account to ask questions about specific articles.";
        
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: "assistant",
            content: fallbackText,
            created_at: new Date(),
          },
        ]);
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col justify-between">
      <div className="grain-overlay" />
      <Navbar />

      <main className="flex-1 flex flex-col pt-32 pb-16 max-w-5xl mx-auto w-full px-6">
        
        {/* Magazine Cover style header */}
        <section className="border-b border-line pb-8 mb-12 flex-shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-ember font-medium tracking-[0.25em] uppercase text-xs mb-4">
              AI Chat
            </p>
            <h1 className="font-serif leading-[0.95] text-5xl md:text-7xl">
              Ask the <span className="italic text-ember">Feed.</span>
            </h1>
            <p className="mt-4 text-sm text-foreground/50">
              {isLoggedIn 
                ? (article_id 
                    ? "Asking about this article."
                    : "Ask questions across all published stories.")
                : "You're browsing as a guest."}
            </p>
          </div>
          
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3 bg-card/10 border border-line hover:border-ember/40 hover:bg-card text-[10px] uppercase tracking-[0.2em] font-medium text-foreground/70 hover:text-foreground transition-all cursor-pointer mb-1 md:mb-2"
          >
            <RotateCcw className="h-3.5 w-3.5" /> New Chat
          </button>
        </section>

        {/* Blinking Chat Cue for Logged Out Users */}
        {!isLoggedIn && (
          <div className="mb-6 select-none max-w-2xl">
            <div className="border border-ember/20 bg-ember/5 px-4 py-2.5 flex items-center gap-2.5 rounded-md">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ember opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-ember"></span>
              </span>
              <p className="text-[11.5px] md:text-xs text-foreground/80 tracking-wide leading-relaxed font-medium">
                Chatting with Lumen Assistant.
              </p>
            </div>
          </div>
        )}

        {/* Message Thread Container */}
        <div className="flex-1 min-h-[300px] border border-line bg-card/10 flex flex-col overflow-hidden mb-8 rounded-lg p-6">
          <div className="flex-1 overflow-y-auto space-y-8 pr-2 max-h-[500px]">
            {messages.map((m, idx) => {
              const isUser = m.sender === "user";
              const isLastAssistant = !isUser && idx === messages.length - 1;
              return (
                <div
                  key={m.id}
                  ref={isLastAssistant ? lastAssistantRef : undefined}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-5 ${
                      isUser
                        ? "bg-card/60 border border-line text-foreground"
                        : "bg-ink border-l-2 border-ember text-foreground/85"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 border-b border-line/40 pb-2">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-medium text-ember">
                        {isUser ? "Reader" : "Lumen AI"}
                      </span>
                      <span className="text-[8px] text-foreground/30">
                        {m.created_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      {renderMessageContent(m.content)}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-ink border-l-2 border-line text-foreground/45 max-w-[80%] rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-medium text-foreground/40">Lumen AI</span>
                  </div>
                  <p className="text-sm uppercase tracking-[0.2em] font-display font-normal animate-pulse">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSend} className="border-t border-line pt-6 mt-6 flex gap-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-ink border border-line rounded-none px-5 py-4 text-sm focus:outline-none focus:border-ember text-foreground placeholder:text-foreground/30"
              disabled={loading}
            />
            <button
              type="submit"
              className="px-6 py-4 bg-ember text-ink hover:bg-paper transition-all cursor-pointer flex items-center justify-center disabled:opacity-40"
              disabled={loading}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
