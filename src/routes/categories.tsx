import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { FeaturedCategories } from "@/components/landing/FeaturedCategories";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Lumen" },
      { name: "description", content: "Browse Lumen by topic — Technology, Science, Politics, Startups, Lifestyle, AI." },
      { property: "og:title", content: "Categories — Lumen" },
      { property: "og:description", content: "Browse Lumen by topic." },
    ],
  }),
  component: Categories,
});

function Categories() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Navbar />
      <main className="pt-32">
        <div className="mx-auto max-w-5xl px-6 md:px-12 pt-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ember mb-8">The index</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[0.95]">
            All <span className="italic text-ember">categories.</span>
          </h1>
        </div>
        <FeaturedCategories />
      </main>
      <Footer />
    </div>
  );
}
