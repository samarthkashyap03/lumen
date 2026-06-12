import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { auth, UserRole } from "@/lib/auth";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Lumen" },
      { name: "description", content: "Sign back into your Lumen reading sanctuary." },
    ],
  }),
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("reader");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = role === "admin" ? `${API_URL}/api/admin/login` : `${API_URL}/api/auth/login`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Authentication failed.");
      }

      const data = await response.json();
      auth.setSession(data.session_token, data.user_id, data.name, data.role);

      toast.success(`Welcome back, ${data.name}!`);

      if (data.role === "admin") {
        navigate({ to: "/admin" });
      } else if (data.role === "editor") {
        navigate({ to: "/cms" });
      } else {
        navigate({ to: "/feed" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="grain-overlay" />
      <Navbar />
      <main className="pt-32 pb-24 flex items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-md border border-line p-10 bg-card/25 backdrop-blur-md rounded-lg shadow-2xl transition-all duration-500 hover:border-ember/30">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ember mb-6 font-semibold">
            Returning reader
          </p>
          <h1 className="font-serif text-4xl md:text-5xl leading-none italic text-foreground">
            Welcome back.
          </h1>
          <p className="mt-3 text-sm text-foreground/50">Sign in to resume reading with intent.</p>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {/* Role Toggle Selector */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-[0.25em] text-foreground/60 block">
                Sign In As
              </Label>
              <div className="grid grid-cols-3 gap-2 border border-line p-1 rounded bg-ink/50">
                <button
                  type="button"
                  onClick={() => setRole("reader")}
                  className={`py-2 text-[10px] uppercase tracking-[0.12em] font-medium transition-all ${
                    role === "reader"
                      ? "bg-ember text-ink font-semibold"
                      : "text-foreground/60 hover:text-foreground hover:bg-card/20"
                  }`}
                >
                  Reader
                </button>
                <button
                  type="button"
                  onClick={() => setRole("editor")}
                  className={`py-2 text-[10px] uppercase tracking-[0.12em] font-medium transition-all ${
                    role === "editor"
                      ? "bg-ember text-ink font-semibold"
                      : "text-foreground/60 hover:text-foreground hover:bg-card/20"
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/admin" })}
                  className="py-2 text-[10px] uppercase tracking-[0.12em] font-medium transition-all text-foreground/60 hover:text-foreground hover:bg-card/20"
                >
                  Admin
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[10px] uppercase tracking-[0.25em] text-foreground/60"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@lumen.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-0 border-b border-line rounded-none px-0 focus-visible:ring-0 focus-visible:border-ember text-foreground placeholder:text-foreground/20"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label
                  htmlFor="password"
                  className="text-[10px] uppercase tracking-[0.25em] text-foreground/60"
                >
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-[10px] uppercase tracking-[0.15em] text-ember hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-0 border-b border-line rounded-none px-0 pr-8 focus-visible:ring-0 focus-visible:border-ember text-foreground"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-ember transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-8 py-4 bg-ember text-ink text-xs tracking-[0.2em] uppercase font-semibold hover:bg-paper active:scale-[0.98] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "Authenticating..." : "Sign in"}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-line" />
                </div>
                <div className="relative flex justify-center text-[9px] uppercase tracking-[0.2em]">
                  <span className="bg-background px-3 text-foreground/40">Or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href = `${API_URL}/api/auth/login/google?redirect_to=${window.location.origin}`;
                }}
                className="w-full px-8 py-4 border border-line text-foreground hover:bg-card/45 text-xs tracking-[0.2em] uppercase font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
              >
                Continue with Google
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-foreground/50 font-light">
            New here?{" "}
            <Link
              to="/register"
              className="text-ember italic font-serif font-normal hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
