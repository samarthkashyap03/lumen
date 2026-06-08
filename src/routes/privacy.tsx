import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { FileText, Shield, Key, Eye, UserCheck, Inbox } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Lumen" },
      { name: "description", content: "How Lumen handles and protects your personal reading data." },
    ],
  }),
  component: PrivacyPage,
});

const PRIVACY_SECTIONS = [
  {
    id: "collection",
    icon: Eye,
    title: "1. Information We Collect",
    content: (
      <>
        <p>
          We believe in collecting only the absolute minimum amount of information required to deliver a functional, high-quality reading experience.
        </p>
        <ul className="list-disc pl-5 mt-4 space-y-2 text-foreground/70 text-sm">
          <li>
            <strong>Account Credentials:</strong> If you create a reader or editor account, we collect your email address, name, and password (securely hashed) to manage your authentication.
          </li>
          <li>
            <strong>Reading Preferences:</strong> We store your saved articles list, bookmarks, and read-state parameters locally or on our secure database to sync your experience across devices.
          </li>
          <li>
            <strong>Usage Metrics:</strong> We compile aggregate statistics (such as total views, swipes, and reading time) to provide insights to our editors. This data is fully anonymized and does not track individual identity.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "usage",
    icon: UserCheck,
    title: "2. How We Use Information",
    content: (
      <>
        <p>
          Your information is used strictly to run and improve the Lumen platform. We do not sell, rent, or trade your data with advertising networks or third-party brokers.
        </p>
        <p className="mt-3">
          Specifically, we use it to:
        </p>
        <ul className="list-disc pl-5 mt-3 space-y-2 text-foreground/70 text-sm">
          <li>Authenticate and manage your user session.</li>
          <li>Synchronize your personal reading library.</li>
          <li>Provide platform-wide analytics for editors regarding article reach and engagement.</li>
          <li>Respond to support requests or contact inquiries.</li>
        </ul>
      </>
    ),
  },
  {
    id: "security",
    icon: Key,
    title: "3. Data Security",
    content: (
      <>
        <p>
          We implement standard security measures to protect your credentials and data. Passwords are encrypted using industry-standard hashing functions before they ever reach our storage systems.
        </p>
        <p className="mt-3">
          Although no electronic transmission or storage method is completely secure, we actively monitor our databases and keep our software dependencies up to date to minimize security vulnerabilities.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    icon: Shield,
    title: "4. Your Rights and Choices",
    content: (
      <>
        <p>
          You remain in full control of your reading data. You have the right to request access to, correction of, or deletion of your personal account at any time.
        </p>
        <p className="mt-3">
          If you wish to terminate your account and wipe all database entries associated with your email address, you can do so by contacting us directly. We process all deletion requests within 30 days.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    icon: Inbox,
    title: "5. Contact & Support",
    content: (
      <>
        <p>
          If you have any questions or concerns regarding our privacy practices, please contact our support team.
        </p>
        <p className="mt-3">
          Email: <span className="text-ember font-serif italic">samarthkashyap.de@gmail.com</span>
        </p>
      </>
    ),
  },
];

function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div className="grain-overlay" />
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[45vh] flex flex-col justify-end px-6 md:px-12 lg:px-20 pt-32 pb-16 border-b border-line">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl"
        >
          <p className="text-ember font-medium tracking-[0.25em] uppercase text-xs mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-ember" />
            Lumen Trust
          </p>
          <h1 className="font-serif italic leading-[0.95] tracking-tight text-[clamp(2.5rem,7vw,5.5rem)] mb-6">
            Privacy Policy.
          </h1>
          <p className="text-base text-foreground/60 font-light max-w-xl border-l border-ember pl-5 leading-relaxed">
            Last updated: June 7, 2026. This policy outlines how we handle your personal data. We keep it straightforward, standard, and transparent.
          </p>
        </motion.div>
      </section>

      {/* Main Layout Grid */}
      <section className="px-6 md:px-12 lg:px-20 py-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left Navigation Menu (Desktop Only) */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-36 space-y-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 font-semibold mb-6">
              Sections
            </p>
            <nav className="space-y-4">
              {PRIVACY_SECTIONS.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="block text-xs uppercase tracking-wider text-foreground/50 hover:text-ember transition-colors"
                >
                  {sec.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main Privacy Text */}
          <div className="lg:col-span-9 space-y-16">
            <div className="prose prose-invert max-w-none text-base md:text-lg text-foreground/75 leading-relaxed font-light space-y-6">
              <p>
                Lumen is designed to be a sanctuary for readers. We value the trust you place in us, and we are committed to respecting and protecting your privacy. This document explains what information we collect, how it is stored, and your rights concerning that data.
              </p>
              <p>
                By using Lumen, you agree to the terms laid out in this Privacy Policy. If you do not agree with any part of this document, please discontinue use of the site and services.
              </p>
            </div>

            <hr className="border-line" />

            {/* Privacy Sections list */}
            <div className="space-y-12">
              {PRIVACY_SECTIONS.map((sec) => (
                <div
                  key={sec.id}
                  id={sec.id}
                  className="group scroll-mt-36 border border-line bg-card/5 hover:bg-card/10 p-8 rounded-lg transition-all duration-300 hover:border-ember/25"
                >
                  <div className="flex items-center gap-4 border-b border-line/50 pb-4 mb-6">
                    <sec.icon className="h-5 w-5 text-ember shrink-0" />
                    <h2 className="font-serif text-xl md:text-2xl text-foreground font-medium">
                      {sec.title}
                    </h2>
                  </div>
                  <div className="text-foreground/75 leading-relaxed font-light text-sm md:text-base space-y-4">
                    {sec.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Footer Section */}
      <Footer />
    </div>
  );
}
