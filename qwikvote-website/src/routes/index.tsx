import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Scale, ShieldBan, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FeatureCard } from "@/components/shared/feature-card";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const [pollLink, setPollLink] = useState("");
  const navigate = useNavigate();

  const goToPoll = () => {
    if (!pollLink.trim()) return;
    // Extract poll ID from URL or use as-is
    const match = pollLink.match(/poll\/([a-zA-Z0-9-]+)/);
    const pollId = match ? match[1] : pollLink.trim();
    navigate({ to: "/poll/$pollId", params: { pollId } });
  };

  return (
    <main className="container mx-auto px-4 py-16 relative">
      {/* Floating orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-[10%] w-72 h-72 rounded-full opacity-[0.07] dark:opacity-[0.1] animate-float"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.19 140), transparent 70%)" }}
        />
        <div
          className="absolute top-40 right-[15%] w-96 h-96 rounded-full opacity-[0.05] dark:opacity-[0.08] animate-float"
          style={{ background: "radial-gradient(circle, oklch(0.50 0.15 180), transparent 70%)", animationDelay: "-2s" }}
        />
        <div
          className="absolute bottom-20 left-[30%] w-64 h-64 rounded-full opacity-[0.06] dark:opacity-[0.09] animate-float"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.17 160), transparent 70%)", animationDelay: "-4s" }}
        />
      </div>

      {/* Hero */}
      <section className="text-center space-y-6 mb-20 animate-fade-in-up">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight gradient-text leading-tight">
          Decide Together,
          <br />
          Instantly
        </h1>
        <p
          className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto"
          style={{ animation: "fade-in-up 0.5s ease-out 0.15s both" }}
        >
          Create polls with weighted voting, veto power, and AI-assisted options.
          No account required.
        </p>
        <div style={{ animation: "fade-in-up 0.5s ease-out 0.3s both" }}>
          <Button
            size="lg"
            className="gradient-bg-animated text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.03] text-base px-8 py-3 h-auto animate-glow-pulse"
            render={<Link to="/create" />}
          >
            Create a Poll
          </Button>
        </div>
      </section>

      {/* Poll link input */}
      <section
        className="max-w-md mx-auto mb-20"
        style={{ animation: "fade-in-up 0.5s ease-out 0.4s both" }}
      >
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-2">Have a poll link?</p>
          <div className="flex gap-2">
            <Input
              placeholder="Paste a poll link or ID..."
              value={pollLink}
              onChange={(e) => setPollLink(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goToPoll()}
              className="bg-background/50"
            />
            <Button variant="outline" onClick={goToPoll} className="hover:bg-primary/10 transition-colors">
              Go
            </Button>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
        <FeatureCard
          icon={Scale}
          title="Weighted Voting"
          description="Express conviction from 1-5"
          delay={0}
        />
        <FeatureCard
          icon={ShieldBan}
          title="Veto Power"
          description="Disqualify unacceptable options"
          delay={1}
        />
        <FeatureCard
          icon={Sparkles}
          title="AI Suggestions"
          description="LLM-generated options"
          delay={2}
        />
        <FeatureCard
          icon={Zap}
          title="No Account Required"
          description="Create and vote instantly"
          delay={3}
        />
      </section>
    </main>
  );
}
