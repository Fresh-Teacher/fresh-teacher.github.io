import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Cat, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import cat404 from "@/assets/cat-404.jpg.asset.json";
import curiosityCat from "@/assets/curiosity-cat.gif.asset.json";

export function NotFoundPage() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", pathname);
  }, [pathname]);

  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="mb-8 text-center">
        <div className="mb-4 text-8xl font-black text-primary motion-safe:animate-pulse md:text-9xl">
          <span className="inline-block motion-safe:animate-bounce">4</span>
          <span className="inline-block motion-safe:animate-bounce [animation-delay:200ms]">0</span>
          <span className="inline-block motion-safe:animate-bounce [animation-delay:400ms]">4</span>
        </div>
        <div className="mb-2 text-3xl font-bold text-primary md:text-4xl">ERROR!</div>
      </div>

      <img
        src={cat404.url}
        alt="Curious explorer in trouble"
        className="mb-8 h-32 w-32 rounded-full border-4 border-primary object-cover shadow-lg md:h-40 md:w-40"
      />

      <div className="mb-8 max-w-3xl text-center">
        <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-xl backdrop-blur-sm md:p-8">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Cat className="h-6 w-6 text-primary motion-safe:animate-bounce" />
            <h2 className="text-xl font-bold text-card-foreground md:text-2xl">Hey There, Curious Explorer!</h2>
            <Cat className="h-6 w-6 text-primary motion-safe:animate-bounce [animation-delay:500ms]" />
          </div>
          <p className="mb-4 text-lg leading-relaxed text-muted-foreground md:text-xl">
            A <span className="font-bold text-destructive">404 error</span> means the page you are looking for does not exist.
            A <span className="font-bold text-destructive">404 error</span> can also mean that you were trying to play around with a page link.
          </p>
          <div className="mb-4 flex justify-center">
            <img
              src={curiosityCat.url}
              alt="Curious cat animation"
              loading="lazy"
              className="h-40 w-40 rounded-xl border-4 border-destructive object-cover shadow-lg md:h-48 md:w-48"
            />
          </div>
          <div className="mb-2 text-2xl font-bold text-primary md:text-3xl">Remember: Curiosity killed the cat...</div>
          <div className="flex items-center justify-center gap-2 text-xl font-bold text-destructive md:text-2xl">
            DON'T BE THAT CAT!
            <span className="text-3xl motion-safe:animate-bounce" aria-hidden>😹</span>
          </div>
          <div className="mt-4 inline-block break-all rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Lost path: <code className="font-mono text-destructive">{pathname}</code>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button variant="outline" size="lg" className="gap-2 border-2" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
          Back to Previous Page
        </Button>
        <Button size="lg" className="gap-2 shadow-lg" onClick={() => navigate({ to: "/" })}>
          <Home className="h-5 w-5" />
          Return to Homepage
        </Button>
      </div>

      <Cat aria-hidden className="pointer-events-none absolute left-10 top-20 h-8 w-8 text-primary opacity-20 motion-safe:animate-bounce" />
      <Cat aria-hidden className="pointer-events-none absolute right-16 top-32 h-6 w-6 text-destructive opacity-20 motion-safe:animate-bounce" />
      <Cat aria-hidden className="pointer-events-none absolute bottom-20 left-20 h-10 w-10 text-primary opacity-20 motion-safe:animate-bounce" />
    </div>
  );
}
