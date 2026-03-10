import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FeatureCard } from "@/components/shared/feature-card";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

/* Custom inline SVG graphics for each feature */
const WeightedVotingGraphic = (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="30" width="8" height="12" rx="2" className="fill-primary/30" />
    <rect x="16" y="22" width="8" height="20" rx="2" className="fill-primary/50" />
    <rect x="26" y="14" width="8" height="28" rx="2" className="fill-primary/70" />
    <rect x="36" y="6" width="8" height="36" rx="2" className="fill-primary" />
  </svg>
);

const VetoPowerGraphic = (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="8" width="28" height="32" rx="4" className="stroke-primary/50" strokeWidth="2" fill="none" />
    <line x1="16" y1="18" x2="32" y2="18" className="stroke-primary/30" strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="24" x2="28" y2="24" className="stroke-primary/30" strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="30" x2="30" y2="30" className="stroke-primary/30" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="40" x2="38" y2="8" className="stroke-destructive" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const AISuggestionsGraphic = (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="28" height="22" rx="6" className="stroke-primary/50" strokeWidth="2" fill="none" />
    <path d="M14 32 L10 38 L18 32" className="stroke-primary/50" strokeWidth="2" strokeLinejoin="round" fill="none" />
    <circle cx="36" cy="10" r="2" className="fill-primary" />
    <circle cx="42" cy="16" r="1.5" className="fill-primary/60" />
    <circle cx="38" cy="22" r="1" className="fill-primary/40" />
  </svg>
);

const NoAccountGraphic = (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 6 L24 28" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M18 22 L24 28 L30 22" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="14" y1="38" x2="34" y2="38" className="stroke-primary/40" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="24" cy="38" r="2" className="fill-primary/60" />
  </svg>
);

function LandingPage() {
  const [pollLink, setPollLink] = useState("");
  const navigate = useNavigate();

  const goToPoll = () => {
    if (!pollLink.trim()) return;
    const match = pollLink.match(/poll\/([a-zA-Z0-9-]+)/);
    const pollId = match ? match[1] : pollLink.trim();
    navigate({ to: "/poll/$pollId", params: { pollId } });
  };

  return (
    <main className="container mx-auto px-4 py-16">
      {/* Hero */}
      <section className="text-center space-y-8 mb-32 reveal d1">
        <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
          Decide Together,
          <br />
          <span className="text-primary">Instantly</span>
        </h1>
        <p className="text-xl leading-relaxed text-muted-foreground max-w-xl mx-auto reveal d2">
          Create polls with weighted voting, veto power, and AI-assisted options.
          No account required.
        </p>
        <div className="reveal d3">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground btn-lift btn-glow text-base px-8 py-3 h-auto"
            render={<Link to="/create" />}
          >
            Create a Poll
          </Button>
        </div>
      </section>

      {/* Poll link input */}
      <section className="max-w-md mx-auto mb-32 reveal d4">
        <div className="surface p-6">
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
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
        <FeatureCard
          graphic={WeightedVotingGraphic}
          title="Weighted Voting"
          description="Express conviction from 1-5"
          delay={0}
        />
        <FeatureCard
          graphic={VetoPowerGraphic}
          title="Veto Power"
          description="Disqualify unacceptable options"
          delay={1}
        />
        <FeatureCard
          graphic={AISuggestionsGraphic}
          title="AI Suggestions"
          description="LLM-generated options"
          delay={2}
        />
        <FeatureCard
          graphic={NoAccountGraphic}
          title="No Account Required"
          description="Create and vote instantly"
          delay={3}
        />
      </section>
    </main>
  );
}
