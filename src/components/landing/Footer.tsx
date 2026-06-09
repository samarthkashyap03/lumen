import { Link } from "@tanstack/react-router";
import { Twitter, Github, Linkedin, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-line">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20 py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-baseline gap-2">
              <span className="font-serif italic text-2xl">Lumen</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-ember">N°01</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm text-foreground/55 leading-relaxed">
              Handpicked journalism, AI-summarised for busy readers. Built with precision by{" "}
              <a href="https://github.com/samarthkashyap03" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-ember transition-colors underline decoration-line/40 underline-offset-4">Samarth Kashyap</a>. Read smarter, not longer.
            </p>
            <div className="mt-6 flex items-center gap-4">
              {[Twitter, Github, Linkedin, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-foreground/50 hover:text-ember transition-colors"
                  aria-label="social"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Internal nav columns */}
          {[
            {
              title: "Product",
              links: [
                ["Features", "/features"],
                ["Feed", "/feed"],
                ["Chat", "/chat"],
              ],
            },
            {
              title: "Editorial",
              links: [
                ["About", "/about"],
                ["Tech Stack", "/tech-stack"],
                ["Privacy", "/privacy"],
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <div className="text-[10px] uppercase tracking-[0.3em] text-ember mb-5">
                {col.title}
              </div>
              <ul className="space-y-3">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      to={href as any}
                      className="text-sm text-foreground/65 hover:text-foreground transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* External social links */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-ember mb-5">Connect</div>
            <ul className="space-y-3">
              {[
                { label: "GitHub", href: "https://github.com/samarthkashyap03" },
                { label: "LinkedIn", href: "https://www.linkedin.com/in/samarthkashyap/" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground/65 hover:text-foreground transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/40">
            © {new Date().getFullYear()} Lumen. All rights reserved.
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/40 font-serif italic">
            Made for readers who care, by <a href="https://www.linkedin.com/in/samarthkashyap/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" title="Developer Samarth Kashyap">Samarth Kashyap</a>.
          </div>
        </div>
      </div>
    </footer>
  );
}
