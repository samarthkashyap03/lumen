import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { ArrowLeft, RefreshCw } from "lucide-react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Top rule */}
      <div className="absolute top-0 inset-x-0 h-px bg-line" />

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        {/* Issue label */}
        <p className="text-ember font-medium tracking-[0.25em] uppercase text-xs flex items-center justify-center gap-4">
          <span className="h-px w-8 bg-ember" />
          Error 404
          <span className="h-px w-8 bg-ember" />
        </p>

        {/* Large editorial number */}
        <div className="font-serif italic leading-none text-[clamp(6rem,25vw,18rem)] text-foreground/8 select-none">
          404
        </div>

        <div className="-mt-8 space-y-4">
          <h1 className="font-serif italic text-4xl md:text-6xl leading-[0.95] text-foreground">
            This page has{" "}
            <span className="text-ember">gone quiet.</span>
          </h1>
          <p className="text-base text-foreground/55 font-light max-w-md mx-auto leading-relaxed border-l-2 border-ember pl-5 text-left">
            The page you were looking for doesn't exist or has been moved.
            Head back to the sanctuary and keep reading.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/"
            className="px-8 py-4 bg-ember text-ink font-medium text-xs tracking-[0.2em] uppercase hover:bg-paper transition-colors duration-500 flex items-center gap-2"
          >
            Back to Home
          </Link>
          <Link
            to="/feed"
            className="px-8 py-4 border border-line text-xs tracking-[0.2em] uppercase hover:bg-card transition-colors duration-500"
          >
            Open the Feed
          </Link>
        </div>
      </div>

      {/* Bottom rule */}
      <div className="absolute bottom-6 inset-x-0 px-6 md:px-12 lg:px-20 flex justify-between">
        <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/25">Lumen — N°01</span>
        <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/25 font-serif italic">Page not found</span>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Top rule */}
      <div className="absolute top-0 inset-x-0 h-px bg-line" />

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        {/* Issue label */}
        <p className="text-ember font-medium tracking-[0.25em] uppercase text-xs flex items-center justify-center gap-4">
          <span className="h-px w-8 bg-ember" />
          System Error
          <span className="h-px w-8 bg-ember" />
        </p>

        <div className="space-y-4">
          <h1 className="font-serif italic text-4xl md:text-6xl leading-[0.95] text-foreground">
            Something{" "}
            <span className="text-ember">broke.</span>
          </h1>
          <p className="text-base text-foreground/55 font-light max-w-md mx-auto leading-relaxed border-l-2 border-ember pl-5 text-left">
            An unexpected error occurred on our end. You can try again or head
            back to the sanctuary.
          </p>

          {/* Error message in a code-like block */}
          {error?.message && (
            <div className="mt-2 border border-line bg-card/20 px-4 py-3 text-left max-w-md mx-auto">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ember mb-1">Error detail</p>
              <code className="text-xs text-foreground/50 font-mono break-all">
                {error.message}
              </code>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="px-8 py-4 bg-ember text-ink font-medium text-xs tracking-[0.2em] uppercase hover:bg-paper transition-colors duration-500 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </button>
          <a
            href="/"
            className="px-8 py-4 border border-line text-xs tracking-[0.2em] uppercase hover:bg-card transition-colors duration-500 flex items-center gap-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Go Home
          </a>
        </div>
      </div>

      {/* Bottom rule */}
      <div className="absolute bottom-6 inset-x-0 px-6 md:px-12 lg:px-20 flex justify-between">
        <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/25">Lumen — N°01</span>
        <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/25 font-serif italic">Unexpected error</span>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lumen — Journalism, recomposed." },
      { name: "description", content: "An editorial reading sanctuary. AI distils the noise so you can settle into the story. Designed for depth, built for the curious." },
      { name: "author", content: "Lumen" },
      { property: "og:title", content: "Lumen — Journalism, recomposed." },
      { property: "og:description", content: "An editorial reading sanctuary for the curious mind." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Lumen — Journalism, recomposed." },
      { name: "twitter:description", content: "An editorial reading sanctuary for the curious mind." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { Toaster } from "@/components/ui/sonner";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
