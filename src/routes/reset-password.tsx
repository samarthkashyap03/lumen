import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose New Password — Lumen" },
      { name: "description", content: "Create a new secure password for your Lumen account." },
    ],
  }),
  component: ResetPassword,
});

// Password strength rules
const rules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character (!@#$…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const navigate = useNavigate();

  // Extract access token from URL hash parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const accessToken = params.get("access_token");
      if (accessToken) {
        setToken(accessToken);
      }
    }
  }, []);

  const passed = useMemo(() => rules.map((r) => r.test(password)), [password]);
  const strength = passed.filter(Boolean).length;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!token) {
      toast.error("Invalid or expired reset session. Please request a new link.");
      return;
    }

    if (!password) {
      toast.error("Please enter a new password.");
      return;
    }

    if (!allPassed) {
      toast.error("Password does not meet the requirements.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Password reset failed.");
      }

      toast.success("Password updated successfully! Please sign in.");
      navigate({ to: "/login" });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password. Please try again.");
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
            Security Desk
          </p>
          <h1 className="font-serif text-4xl md:text-5xl leading-none text-foreground">
            New <span className="italic text-ember">Credentials.</span>
          </h1>

          {!token ? (
            <div className="mt-6 space-y-6">
              <p className="text-sm text-foreground/50">
                Reset link appears invalid, expired, or you accessed this page directly.
              </p>
              <Link
                to="/forgot-password"
                className="inline-block px-8 py-4 bg-ember text-ink text-xs tracking-[0.2em] uppercase font-semibold hover:bg-paper active:scale-[0.98] transition-all duration-300"
              >
                Request new reset link
              </Link>
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm text-foreground/50">
                Choose a strong new password to secure your account.
              </p>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="pass" className="text-[10px] uppercase tracking-[0.25em] text-foreground/60">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="pass"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setTouched(true);
                      }}
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
                  {loading ? "Updating password..." : "Reset password"}
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-sm text-foreground/50 font-light">
            Go back to{" "}
            <Link to="/login" className="text-ember italic font-serif font-normal hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
