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
          <div className="min-h-screen bg-background">
            <Header />
            <Outlet />
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
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">{error.message}</p>
        <a href="/" className="text-primary underline">
          Go home
        </a>
      </div>
    </div>
  );
}
