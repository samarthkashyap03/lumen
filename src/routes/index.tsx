import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeaturedCategories } from "@/components/landing/FeaturedCategories";
import { FeatureBento } from "@/components/landing/FeatureBento";
import { ReaderComparison } from "@/components/landing/ReaderComparison";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — Journalism, recomposed." },
      { name: "description", content: "An editorial reading sanctuary. AI distills the noise so you can settle into the story. Designed for depth, built for the curious." },
      { property: "og:title", content: "Lumen — Journalism, recomposed." },
      { property: "og:description", content: "An editorial reading sanctuary for the curious mind." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <FeatureBento />
        <FeaturedCategories />
        <ReaderComparison />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
