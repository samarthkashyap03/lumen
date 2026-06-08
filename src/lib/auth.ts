export type UserRole = "reader" | "editor";

export interface UserSession {
  token: string;
  userId: string;
  name: string;
  role: UserRole;
}

const SESSION_KEY = "lumen_auth_session";

export const auth = {
  setSession(token: string, userId: string, name: string, role: UserRole) {
    if (typeof window === "undefined") return;
    const session: UserSession = { token, userId, name, role };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  getSession(): UserSession | null {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as UserSession;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  clearSession() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(SESSION_KEY);
  },

  isAuthenticated(): boolean {
    return this.getSession() !== null;
  },

  isEditor(): boolean {
    const session = this.getSession();
    return session?.role === "editor";
  },

  isReader(): boolean {
    const session = this.getSession();
    return session?.role === "reader";
  },
};
