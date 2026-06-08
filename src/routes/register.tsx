import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import { auth } from "@/lib/auth";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — Lumen" },
      { name: "description", content: "Create your Lumen account and start reading with intent." },
    ],
  }),
  component: Register,
});

// Password rules
const rules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character (!@#$…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const navigate = useNavigate();

  const passed = useMemo(() => rules.map((r) => r.test(password)), [password]);
  const strength = passed.filter(Boolean).length; // 0–5
  const allPassed = strength === rules.length;

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Excellent"][strength];
  const strengthColor = [
    "",
    "bg-red-500",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-lime-400",
    "bg-emerald-500",
  ][strength];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!name || !email || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!allPassed) {
      toast.error("Password does not meet the requirements.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "editor" }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Registration failed.");
      }

      const data = await response.json();
      auth.setSession(data.session_token, data.user_id, data.name, data.role);
      toast.success(`Welcome to Lumen, ${data.name}! Account created.`);

      if (data.role === "editor") {
        navigate({ to: "/cms" });
      } else {
        navigate({ to: "/feed" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create account. Please try again.");
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
            Issue 01 — open
          </p>
          <h1 className="font-serif text-4xl md:text-5xl leading-none text-foreground">
            Join <span className="italic text-ember">Lumen.</span>
          </h1>
          <p className="mt-3 text-sm text-foreground/50">
            Read and publish with intent. Set up in seconds.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleRegister}>
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="reg-name" className="text-[10px] uppercase tracking-[0.25em] text-foreground/60">
                Name
              </Label>
              <Input
                id="reg-name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent border-0 border-b border-line rounded-none px-0 focus-visible:ring-0 focus-visible:border-ember text-foreground placeholder:text-foreground/20"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="reg-email" className="text-[10px] uppercase tracking-[0.25em] text-foreground/60">
                Email
              </Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="you@lumen.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-0 border-b border-line rounded-none px-0 focus-visible:ring-0 focus-visible:border-ember text-foreground placeholder:text-foreground/20"
                disabled={loading}
              />
            </div>

            {/* Password with toggle */}
            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-[10px] uppercase tracking-[0.25em] text-foreground/60">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setTouched(true); }}
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

              {/* Strength bar */}
              {touched && password.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i < strength ? strengthColor : "bg-line"
                        }`}
                      />
                    ))}
                  </div>
                  {strengthLabel && (
                    <p className={`text-[10px] uppercase tracking-[0.15em] font-medium transition-colors ${
                      strength <= 2 ? "text-red-400" : strength === 3 ? "text-yellow-400" : "text-emerald-400"
                    }`}>
                      {strengthLabel}
                    </p>
                  )}

                  {/* Rule checklist */}
                  <ul className="mt-2 space-y-1">
                    {rules.map((rule, i) => (
                      <li key={rule.label} className="flex items-center gap-2">
                        <span className={`text-[10px] transition-colors ${passed[i] ? "text-emerald-400" : "text-foreground/30"}`}>
                          {passed[i] ? "✓" : "○"}
                        </span>
                        <span className={`text-[10px] tracking-wide transition-colors ${passed[i] ? "text-foreground/60" : "text-foreground/30"}`}>
                          {rule.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (touched && !allPassed)}
              className="w-full px-8 py-4 bg-ember text-ink text-xs tracking-[0.2em] uppercase font-semibold hover:bg-paper active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-foreground/50 font-light">
            Already in?{" "}
            <Link to="/login" className="text-ember italic font-serif font-normal hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
