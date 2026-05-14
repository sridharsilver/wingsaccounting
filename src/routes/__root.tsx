import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
  useNavigate
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Toaster } from "@/components/ui/sonner";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { supabase } from "@/lib/supabase";
import { ChatBot } from "@/components/chat/ChatBot";
import { WhatsAppButton } from "@/components/chat/WhatsAppButton";
import { useSiteSettings } from "@/hooks/use-site-settings";

import appCss from "../styles.css?url";

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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { title: "Wings Design Studio — Premium Printing, Branding & Web Design" },
      { name: "description", content: "Wings Design Studio delivers commercial printing, graphic design, branding and modern web design for ambitious brands." },
      { name: "author", content: "Wings Design Studio" },
      { name: "theme-color", content: "#9b4dff" },
      { name: "robots", content: "index, follow" },
      { property: "og:site_name", content: "Wings Design Studio" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@WingsDesign" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b8cb60f6-b5d9-4c40-a0d4-b29c693523c4/id-preview-f9453e97--b2dd65e2-5a5a-4884-9255-a0ff02aa1e00.lovable.app-1778338578672.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b8cb60f6-b5d9-4c40-a0d4-b29c693523c4/id-preview-f9453e97--b2dd65e2-5a5a-4884-9255-a0ff02aa1e00.lovable.app-1778338578672.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeadContent />
      {children}
      <Scripts />
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // If running as a native app (Android/APK), handle redirects while splash is showing
    if (Capacitor.isNativePlatform() && pathname === "/") {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate({ to: "/admin" });
        } else {
          navigate({ to: "/login" });
        }
      });
    }
  }, [pathname, navigate]);

  const { settings } = useSiteSettings();
  const isAdmin = pathname.startsWith("/admin") || pathname === "/login";

  return (
    <QueryClientProvider client={queryClient}>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Outlet />
      {!isAdmin && settings.show_chatbot && <ChatBot />}
      {!isAdmin && pathname !== "/contact" && settings.show_enquiry_form && <WhatsAppButton />}
      <Toaster />
    </QueryClientProvider>
  );
}
