import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/features", label: "Features" },
  { to: "/feed", label: "Feed" },
  { to: "/chat", label: "Chat" },
  { to: "/cms", label: "CMS" },
  { to: "/cms/work", label: "My Work" },
  { to: "/analytics", label: "Analytics" },
  { to: "/admin", label: "Admin" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(() => auth.getSession());
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Poll for session updates in case of login/logout actions
  useEffect(() => {
    const interval = setInterval(() => {
      const activeSession = auth.getSession();
      setSession((prev: any) => {
        if (JSON.stringify(prev) !== JSON.stringify(activeSession)) {
          return activeSession;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu on route change
  const handleNavClick = () => setMenuOpen(false);

  const handleSignOut = () => {
    auth.clearSession();
    setSession(null);
    setMenuOpen(false);
    navigate({ to: "/login" });
  };

  // Filter links: hide CMS, My Work, and Analytics for non-editors/admins, and Admin for non-admins
  const visibleLinks = links.filter((l) => {
    if (l.to === "/cms" || l.to === "/cms/work" || l.to === "/analytics") {
      return session?.role === "editor" || session?.role === "admin";
    }
    if (l.to === "/admin") {
      return session?.role === "admin";
    }
    return true;
  });

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled || menuOpen
            ? "bg-ink/90 backdrop-blur-md border-b border-line"
            : "bg-transparent",
        )}
      >
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-baseline gap-2" onClick={handleNavClick}>
              <span className="font-serif italic text-2xl text-foreground">Lumen</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-ember">N°01</span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              {visibleLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to as any}
                  className="text-xs uppercase tracking-[0.2em] text-foreground/60 hover:text-ember transition-colors"
                  activeProps={{
                    className: "text-xs uppercase tracking-[0.2em] text-ember font-semibold",
                  }}
                  activeOptions={{ exact: true }}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-6">
              {session ? (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-foreground/80 font-medium truncate max-w-[120px]">
                      {session.name}
                    </span>
                    <span className="text-[8px] uppercase tracking-[0.2em] text-ember bg-ember/10 border border-ember/30 px-1.5 py-0.5 rounded leading-none mt-1">
                      {session.role}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-xs uppercase tracking-[0.2em] text-foreground/60 hover:text-ember transition-colors cursor-pointer border border-line hover:border-ember px-3.5 py-2"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-xs uppercase tracking-[0.2em] text-foreground/60 hover:text-ember transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 bg-ember text-ink text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-paper transition-colors"
                  >
                    Subscribe
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: hamburger + subscribe pill */}
            <div className="flex md:hidden items-center gap-3">
              {!session && (
                <Link
                  to="/register"
                  onClick={handleNavClick}
                  className="px-4 py-2 bg-ember text-ink text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-paper transition-colors"
                >
                  Subscribe
                </Link>
              )}
              <button
                id="mobile-menu-toggle"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                className="text-foreground/70 hover:text-ember transition-colors p-1"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-16 z-40 md:hidden bg-ink/95 backdrop-blur-md border-b border-line"
          >
            <div className="px-6 pt-6 pb-8 flex flex-col gap-1">
              {visibleLinks.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                >
                  <Link
                    to={l.to as any}
                    onClick={handleNavClick}
                    className="block py-3 border-b border-line/40 text-sm uppercase tracking-[0.2em] text-foreground/60 hover:text-ember transition-colors"
                    activeProps={{
                      className:
                        "block py-3 border-b border-line/40 text-sm uppercase tracking-[0.2em] text-ember font-semibold",
                    }}
                    activeOptions={{ exact: true }}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}

              {/* Auth row */}
              <div className="mt-6 pt-2">
                {session ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground/80 font-medium">{session.name}</p>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-ember">
                        {session.role}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="text-xs uppercase tracking-[0.2em] text-foreground/60 hover:text-ember transition-colors border border-line hover:border-ember px-4 py-2"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Link
                      to="/login"
                      onClick={handleNavClick}
                      className="flex-1 text-center py-2.5 border border-line text-xs uppercase tracking-[0.2em] text-foreground/70 hover:text-ember hover:border-ember transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={handleNavClick}
                      className="flex-1 text-center py-2.5 bg-ember text-ink text-xs uppercase tracking-[0.2em] font-medium hover:bg-paper transition-colors"
                    >
                      Subscribe
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
