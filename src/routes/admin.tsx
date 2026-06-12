import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { auth } from "@/lib/auth";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";
import {
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Users,
  BookOpen,
  Smartphone,
  Award,
  Clock,
  LogOut,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Control Desk — Lumen Admin" },
      { name: "description", content: "Lumen platform administrative controls." },
    ],
  }),
  component: AdminPage,
});

type UserData = {
  id: string;
  email: string;
  name: string;
  role: "reader" | "editor" | "admin";
  created_at: string;
};

type ArticleData = {
  id: string;
  url: string;
  title: string;
  author: string;
  category: string;
  status: "processing" | "completed" | "failed";
  created_at: string;
};

type AnalyticsData = {
  total_users: number;
  total_articles: number;
  total_views: number;
  total_swipes: number;
  total_reads: number;
  dwell_time_avg: number;
  category_distribution: { name: string; value: number }[];
};

function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const navigate = useNavigate();

  // Login form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard states
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "posts">("stats");
  const [users, setUsers] = useState<UserData[]>([]);
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Search/Filters
  const [userQuery, setUserQuery] = useState("");
  const [postQuery, setPostQuery] = useState("");

  useEffect(() => {
    setMounted(true);
    const session = auth.getSession();
    if (session && session.role === "admin") {
      setIsAdmin(true);
      setAdminToken(session.token);
    }
  }, []);

  // Fetch admin data once authenticated
  useEffect(() => {
    if (isAdmin && adminToken) {
      fetchDashboardData();
    }
  }, [isAdmin, adminToken]);

  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      // Fetch users
      const usersRes = await fetch(`${API_URL}/api/admin/users?token=${adminToken}`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      // Fetch articles
      const articlesRes = await fetch(`${API_URL}/api/admin/articles?token=${adminToken}`);
      if (articlesRes.ok) {
        const articlesData = await articlesRes.json();
        setArticles(articlesData);
      }

      // Fetch general stats
      const statsRes = await fetch(`${API_URL}/api/analytics/summary`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      toast.error("Failed to load administration dataset.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoginLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Incorrect administrative credentials.");
      }

      const data = await response.json();
      auth.setSession(data.session_token, data.user_id, data.name, data.role);
      setAdminToken(data.session_token);
      setIsAdmin(true);
      toast.success("Welcome to the Control Desk, Administrator.");
    } catch (err: any) {
      toast.error(err.message || "Failed to authenticate admin session.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    auth.clearSession();
    setIsAdmin(false);
    setAdminToken("");
    toast.info("Logged out of Control Desk.");
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove all access for ${userName}?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}?token=${adminToken}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success(`Access removed for ${userName}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      // Re-fetch stats to update counts
      fetchDashboardData();
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role?token=${adminToken}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Role updated to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u))
      );
    } catch {
      toast.error("Failed to update user role.");
    }
  };

  const handleDeleteArticle = async (articleId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/cms/articles/${articleId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Article deleted successfully.");
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      fetchDashboardData();
    } catch {
      toast.error("Failed to delete article.");
    }
  };

  if (!mounted) return null;

  // Render Login page if not admin
  if (!isAdmin) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background">
        <div className="grain-overlay" />
        <Navbar />
        <main className="pt-32 pb-24 flex items-center justify-center px-6 relative z-10">
          <div className="w-full max-w-md border border-line p-10 bg-card/25 backdrop-blur-md rounded-lg shadow-2xl transition-all duration-500 hover:border-ember/30">
            <p className="text-[10px] uppercase tracking-[0.3em] text-ember mb-6 font-semibold flex items-center gap-1.5 justify-center">
              <ShieldAlert className="h-3 w-3" /> Secure Administrator Login
            </p>
            <h1 className="font-serif text-4xl md:text-5xl leading-none italic text-foreground text-center">
              Control Desk
            </h1>
            <p className="mt-3 text-sm text-foreground/50 text-center">
              Elevated access dashboard for Lumen Briefing.
            </p>

            <form className="mt-8 space-y-6" onSubmit={handleAdminLogin}>
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-[10px] uppercase tracking-[0.25em] text-foreground/60"
                >
                  Admin Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@lumenbrief.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-0 border-b border-line rounded-none px-0 focus-visible:ring-0 focus-visible:border-ember text-foreground placeholder:text-foreground/20 text-center"
                  disabled={loginLoading}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-[10px] uppercase tracking-[0.25em] text-foreground/60"
                >
                  Admin Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent border-0 border-b border-line rounded-none px-0 pr-8 focus-visible:ring-0 focus-visible:border-ember text-foreground text-center"
                    disabled={loginLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-ember transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full px-8 py-4 bg-ember text-ink text-xs tracking-[0.2em] uppercase font-semibold hover:bg-paper active:scale-[0.98] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-8"
              >
                {loginLoading ? "Verifying Keys..." : "Access Control"}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // Filter users & articles
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userQuery.toLowerCase())
  );

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(postQuery.toLowerCase()) ||
      a.author.toLowerCase().includes(postQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(postQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col justify-between">
      <div className="grain-overlay" />
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto w-full relative z-10">
        {/* Header section */}
        <section className="border-b border-line pb-8 mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-ember font-medium tracking-[0.25em] uppercase text-xs mb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-ember" /> CONTROL DESK
            </p>
            <h1 className="font-serif leading-[0.95] text-5xl md:text-7xl text-foreground">
              Sanctuary <span className="italic text-ember">Admin.</span>
            </h1>
            <p className="mt-4 text-sm text-foreground/50 max-w-xl font-light leading-relaxed">
              Supervising dispatches, reader logs, and system operations for Lumen.
            </p>
          </div>

          <button
            onClick={handleAdminLogout}
            className="px-6 py-3 border border-line hover:border-destructive hover:bg-destructive/5 hover:text-destructive transition-all cursor-pointer font-medium text-xs tracking-[0.15em] uppercase flex items-center gap-2 self-start md:self-end"
          >
            <LogOut className="h-4 w-4" /> Exit Desk
          </button>
        </section>

        {/* Tab Controls */}
        <div className="flex border-b border-line mb-8 overflow-x-auto">
          {[
            { id: "stats", label: "Overview & Stats" },
            { id: "users", label: `User Directory (${users.length})` },
            { id: "posts", label: `Dispatches (${articles.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`py-3.5 px-6 text-xs uppercase tracking-[0.2em] font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === t.id
                  ? "border-ember text-ember bg-ember/5"
                  : "border-transparent text-foreground/45 hover:text-foreground hover:bg-card/10"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Tabs */}
        {loadingData ? (
          <div className="py-24 text-center">
            <RefreshCw className="h-8 w-8 text-ember animate-spin mx-auto mb-4" />
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/45 font-serif italic animate-pulse">
              Compiling database telemetry...
            </span>
          </div>
        ) : (
          <div className="space-y-12">
            {/* 1. OVERVIEW & STATS */}
            {activeTab === "stats" && stats && (
              <div className="space-y-12">
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                  {[
                    { label: "Active Readers", val: stats.total_users, icon: Users },
                    { label: "Total Articles", val: stats.total_articles, icon: BookOpen },
                    { label: "Total Views", val: stats.total_views, icon: Eye },
                    { label: "Total Swipes", val: stats.total_swipes, icon: Smartphone },
                    { label: "Finished Reads", val: stats.total_reads, icon: Award },
                    { label: "Avg Dwell Time", val: `${stats.dwell_time_avg}s`, icon: Clock },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="border border-line bg-card/10 p-6 flex flex-col justify-between h-36 rounded"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-foreground/45 font-medium leading-normal">
                          {m.label}
                        </span>
                        <m.icon className="h-4 w-4 text-ember" />
                      </div>
                      <div className="font-serif text-3xl md:text-4xl font-light mt-auto">
                        {m.val}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Topic distributions */}
                <div className="border border-line bg-card/5 p-8 rounded max-w-2xl">
                  <h3 className="font-serif text-2xl mb-4">Topic Coverage</h3>
                  <div className="space-y-4">
                    {stats.category_distribution.map((cat) => (
                      <div key={cat.name} className="space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-foreground/75 uppercase tracking-wider">
                            {cat.name}
                          </span>
                          <span className="text-ember font-bold">{cat.value}%</span>
                        </div>
                        <div className="w-full bg-ink/50 h-1.5 border border-line rounded-full overflow-hidden">
                          <div
                            className="bg-ember h-full transition-all duration-500"
                            style={{ width: `${cat.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. USER DIRECTORY */}
            {activeTab === "users" && (
              <div className="space-y-6">
                {/* Search */}
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/35" />
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Search readers by name or email..."
                    className="w-full bg-ink border border-line rounded pl-12 pr-5 py-3.5 text-xs tracking-wider focus:outline-none focus:border-ember text-foreground placeholder:text-foreground/20"
                  />
                </div>

                {/* Users Table */}
                <div className="border border-line rounded overflow-hidden bg-card/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-line bg-ink/40 text-[9px] uppercase tracking-[0.2em] text-foreground/50">
                          <th className="p-4 font-semibold">User Details</th>
                          <th className="p-4 font-semibold">Role</th>
                          <th className="p-4 font-semibold">Joined</th>
                          <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-xs text-foreground/45 italic">
                              No readers matching the search query.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-card/20 text-xs">
                              {/* Details */}
                              <td className="p-4">
                                <p className="font-semibold text-foreground">{u.name}</p>
                                <p className="text-[10px] text-foreground/40 font-mono mt-0.5">
                                  {u.email}
                                </p>
                              </td>
                              {/* Role Select */}
                              <td className="p-4">
                                <select
                                  value={u.role}
                                  onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                  className="bg-ink border border-line text-[10px] uppercase tracking-wider p-1.5 focus:outline-none focus:border-ember text-foreground"
                                >
                                  <option value="reader">Reader</option>
                                  <option value="editor">Editor</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </td>
                              {/* Date Joined */}
                              <td className="p-4 text-[10px] text-foreground/60 font-mono">
                                {new Date(u.created_at).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </td>
                              {/* Delete button */}
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="p-2 border border-line hover:border-destructive hover:bg-destructive/5 text-foreground/45 hover:text-destructive transition-all cursor-pointer rounded"
                                  title="Remove access"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. DISPATCHES */}
            {activeTab === "posts" && (
              <div className="space-y-6">
                {/* Search */}
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/35" />
                  <input
                    type="text"
                    value={postQuery}
                    onChange={(e) => setPostQuery(e.target.value)}
                    placeholder="Search dispatches by title, editor, or category..."
                    className="w-full bg-ink border border-line rounded pl-12 pr-5 py-3.5 text-xs tracking-wider focus:outline-none focus:border-ember text-foreground placeholder:text-foreground/20"
                  />
                </div>

                {/* Articles Table */}
                <div className="border border-line rounded overflow-hidden bg-card/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-line bg-ink/40 text-[9px] uppercase tracking-[0.2em] text-foreground/50">
                          <th className="p-4 font-semibold">Dispatch Info</th>
                          <th className="p-4 font-semibold">Category</th>
                          <th className="p-4 font-semibold">Status</th>
                          <th className="p-4 font-semibold">Created</th>
                          <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {filteredArticles.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-xs text-foreground/45 italic">
                              No dispatches found matching the search query.
                            </td>
                          </tr>
                        ) : (
                          filteredArticles.map((art) => (
                            <tr key={art.id} className="hover:bg-card/20 text-xs">
                              {/* Title / Author */}
                              <td className="p-4 max-w-md">
                                <p className="font-semibold text-foreground truncate">{art.title}</p>
                                <p className="text-[10px] text-foreground/40 mt-0.5">
                                  By {art.author || "Unknown"}
                                </p>
                              </td>
                              {/* Category */}
                              <td className="p-4 text-[10px] uppercase tracking-wider text-ember font-serif italic">
                                {art.category}
                              </td>
                              {/* Status badge */}
                              <td className="p-4">
                                <span
                                  className={`text-[8px] uppercase tracking-[0.15em] border px-2 py-0.5 rounded leading-none ${
                                    art.status === "completed"
                                      ? "bg-ember/10 border-ember/30 text-ember"
                                      : art.status === "processing"
                                        ? "bg-card/60 border-line text-foreground/60 animate-pulse"
                                        : "bg-destructive/10 border-destructive/20 text-destructive"
                                  }`}
                                >
                                  {art.status}
                                </span>
                              </td>
                              {/* Date */}
                              <td className="p-4 text-[10px] text-foreground/60 font-mono">
                                {new Date(art.created_at).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </td>
                              {/* Actions */}
                              <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                <Link
                                  to="/cms/edit/$articleId"
                                  params={{ articleId: art.id }}
                                  className="inline-block p-2 border border-line hover:border-ember hover:bg-ember/5 text-foreground/45 hover:text-ember transition-all rounded"
                                  title="Edit dispatch"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </Link>
                                <button
                                  onClick={() => handleDeleteArticle(art.id, art.title)}
                                  className="p-2 border border-line hover:border-destructive hover:bg-destructive/5 text-foreground/45 hover:text-destructive transition-all cursor-pointer rounded"
                                  title="Delete permanently"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
