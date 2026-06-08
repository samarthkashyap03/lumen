import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/trending")({
  head: () => ({
    meta: [
      { title: "Trending — Lumen" },
      { name: "description", content: "The stories everyone is swiping through right now." },
      { property: "og:title", content: "Trending — Lumen" },
      { property: "og:description", content: "The stories everyone is swiping through right now." },
    ],
  }),
  component: Trending,
});

function Trending() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Navbar />
      <main className="pt-40 pb-32 mx-auto max-w-5xl px-6 md:px-12">
        <p className="text-[10px] uppercase tracking-[0.3em] text-ember mb-8">Live dispatch</p>
        <h1 className="font-serif text-5xl md:text-7xl leading-[0.95]">
          Trending <span className="italic text-ember">now.</span>
        </h1>
        <p className="mt-6 text-foreground/65 max-w-xl text-lg leading-relaxed">
          Coming soon — the most-swiped stories across Lumen, refreshed every minute.
        </p>
      </main>
      <Footer />
    </div>
  );
}
