import { auth } from "@/lib/auth";
import { API_URL } from "@/lib/config";

/**
 * Fire a tracking event to the backend.
 * event_type: "view" | "swipe" | "read" | "dwell_time"
 */
export async function trackEvent(
  event_type: "view" | "swipe" | "read" | "dwell_time",
  article_id: string,
  metadata?: Record<string, unknown>
) {
  try {
    const session = auth.getSession();
    await fetch(`${API_URL}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: session?.userId ?? null,
        article_id,
        event_type,
        metadata: metadata ?? {},
      }),
    });
  } catch {
    // Silent fail — analytics should never break the UI
  }
}
