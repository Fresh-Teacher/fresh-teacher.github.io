import { useMatches as useImportedMatches } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LibraryShell } from '@/components/library-shell';
import { Toaster } from '@/components/ui/sonner';
import { CookieNotice } from '@/components/cookie-notice';
import { InstallPrompt } from '@/components/install-prompt';
import { earlyTapQueueScript } from '@/lib/early-tap-queue';
import appIcon from '@/assets/icon-192.png.asset.json';
import appleIcon from '@/assets/apple-touch-icon.png.asset.json';
import favicon from '@/assets/favicon.png.asset.json';
import { adsenseBootstrap } from '@/lib/adsense';

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Fresh Teacher's Library" },
      { name: "description", content: "Fresh Teacher's educational resource library." },
      { name: "author", content: "Fresh Teacher" },
      { property: "og:title", content: "Fresh Teacher's Library" },
      { property: "og:description", content: "Fresh Teacher's educational resource library." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#1b2437" },
      { name: "application-name", content: "Fresh App" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Fresh App" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: favicon.url, type: "image/png", sizes: "64x64" },
      { rel: "icon", href: appIcon.url, type: "image/png", sizes: "192x192" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: appleIcon.url, sizes: "180x180" },
      { rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" },
      { rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/v4-shims.min.css" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    importedDocument?: {
      html?: import("react").HTMLAttributes<HTMLHtmlElement> & Record<`data-${string}`, string>;
      body?: import("react").HTMLAttributes<HTMLBodyElement> & Record<`data-${string}`, string>;
    };
  }
}

// After a new deploy, old hashed chunks disappear; reload once (per 30s) to fetch the fresh build.
const staleChunkReloadScript = `(function(){var K='ft-chunk-reload';function r(){try{var t=+sessionStorage.getItem(K)||0;if(Date.now()-t<30000)return;sessionStorage.setItem(K,String(Date.now()));}catch(e){}location.reload();}window.addEventListener('vite:preloadError',function(e){e.preventDefault();r();});window.addEventListener('unhandledrejection',function(e){var m=String(e.reason&&e.reason.message||e.reason||'');if(/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(m))r();});})();`;

function RootShell({ children }: { children: ReactNode }) {
  const importedDocument = useImportedMatches({ select: matches => matches.at(-1)?.staticData.importedDocument });
  return (
    <html lang="en" suppressHydrationWarning {...importedDocument?.html}>
      <head>
        <style href="site-import-inline" precedence="imported-inline">{"@layer imported-inline;"}</style>
        <script dangerouslySetInnerHTML={{ __html: earlyTapQueueScript }} />
        <script dangerouslySetInnerHTML={{ __html: staleChunkReloadScript }} />
        <script dangerouslySetInnerHTML={{ __html: adsenseBootstrap }} />
        <HeadContent />
      </head>
      <body {...importedDocument?.body}>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <LibraryShell><Outlet /></LibraryShell>
      <CookieNotice />
      <InstallPrompt />
      <Toaster />
    </QueryClientProvider>
  );
}
