import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { auth } from "@/lib/auth";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";

export const Route = createFileRoute("/oauth-callback")({
  component: OAuthCallback,
});

function OAuthCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (!hash) {
      setErrorMsg("No session credentials found in the URL.");
      return;
    }

    const params = new URLSearchParams(hash.replace("#", "?"));
    const accessToken = params.get("access_token");

    if (!accessToken) {
      setErrorMsg("Failed to extract access token from URL.");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get("role") || "reader";

    // Call backend to validate the session and fetch role info
    const validateSession = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/session?token=${accessToken}&role=${role}`);
        if (!response.ok) {
          throw new Error("Failed to retrieve session info.");
        }
        
        const data = await response.json();
        
        // Save session locally using the access token
        auth.setSession(accessToken, data.user_id, data.name, data.role);
        toast.success(`Welcome back, ${data.name}!`);

        if (data.role === "admin") {
          navigate({ to: "/admin" });
        } else if (data.role === "editor") {
          navigate({ to: "/cms" });
        } else {
          navigate({ to: "/feed" });
        }
      } catch (err: any) {
        setErrorMsg(err.message || "An authentication error occurred.");
        toast.error("Google authentication failed.");
      }
    };

    validateSession();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="grain-overlay" />
      <div className="relative z-10 max-w-sm space-y-4">
        {!errorMsg ? (
          <>
            <span className="text-xs uppercase tracking-[0.2em] text-ember font-serif italic animate-pulse">
              Syncing with secure vault...
            </span>
            <p className="text-xs text-foreground/45">
              Confirming details with Google and finalizing your reading session.
            </p>
          </>
        ) : (
          <>
            <span className="text-xs uppercase tracking-[0.2em] text-red-500 font-serif font-bold">
              Authentication Error
            </span>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {errorMsg}
            </p>
            <button
              onClick={() => navigate({ to: "/login" })}
              className="mt-4 px-6 py-3 border border-line text-[10px] uppercase tracking-[0.2em] hover:bg-card hover:border-ember/40 transition-colors text-foreground/70 hover:text-foreground"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
