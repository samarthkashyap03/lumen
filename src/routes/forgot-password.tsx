import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Lumen" },
      { name: "description", content: "Request a password reset link for your Lumen account." },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to send reset link.");
      }

      setSubmitted(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
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
            Recover <span className="italic text-ember">Access.</span>
          </h1>
          
          {!submitted ? (
            <>
              <p className="mt-3 text-sm text-foreground/50">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.25em] text-foreground/60">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-8 py-4 bg-ember text-ink text-xs tracking-[0.2em] uppercase font-semibold hover:bg-paper active:scale-[0.98] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? "Sending link..." : "Send reset link"}
                </button>
              </form>
            </>
          ) : (
            <div className="mt-6 space-y-6">
              <p className="text-sm text-foreground/75 leading-relaxed font-light">
                An email with instructions to reset your password has been sent to <strong className="text-ember font-medium">{email}</strong>.
              </p>
              <p className="text-xs text-foreground/40 font-light">
                Didn't receive it? Please check your spam folder or try again in a few minutes.
              </p>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-foreground/50 font-light">
            Remembered it?{" "}
            <Link to="/login" className="text-ember italic font-serif font-normal hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
