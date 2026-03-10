import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { queryClient } from "@/lib/query-client";

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RootError,
});

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <TooltipProvider>
          <div className="relative min-h-screen bg-background overflow-hidden">
            {/* Animated gradient mesh background */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
              <div
                className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-[0.03] dark:opacity-[0.05]"
                style={{
                  background:
                    "radial-gradient(ellipse at 20% 50%, oklch(0.72 0.19 140) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, oklch(0.55 0.17 160) 0%, transparent 50%), radial-gradient(ellipse at 40% 80%, oklch(0.50 0.15 180) 0%, transparent 50%)",
                  animation: "gradient-shift 20s ease infinite",
                  backgroundSize: "200% 200%",
                }}
              />
            </div>
            <Header />
            <Outlet />
            <footer className="border-t border-border/30 mt-16 py-6">
              <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                Built with QwikVote — fast decisions, zero friction.
              </div>
            </footer>
            <Toaster richColors />
          </div>
        </TooltipProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}

function RootError({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 animate-fade-in-up">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">{error.message}</p>
        <a href="/" className="text-primary underline hover:text-primary/80 transition-colors">
          Go home
        </a>
      </div>
    </div>
  );
}
