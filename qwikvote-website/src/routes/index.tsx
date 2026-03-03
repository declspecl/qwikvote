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
    <main className="container mx-auto px-4 py-12">
      {/* Hero */}
      <section className="text-center space-y-6 mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Decide Together, Instantly
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Create polls with weighted voting, veto power, and AI-assisted options.
          No account required.
        </p>
        <Button asChild size="lg">
          <Link to="/create">Create a Poll</Link>
        </Button>
      </section>

      {/* Poll link input */}
      <section className="max-w-md mx-auto mb-16">
        <div className="flex gap-2">
          <Input
            placeholder="Paste a poll link or ID..."
            value={pollLink}
            onChange={(e) => setPollLink(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goToPoll()}
          />
          <Button variant="outline" onClick={goToPoll}>
            Go
          </Button>
        </div>
      </section>

      {/* Feature grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        <FeatureCard
          icon={Scale}
          title="Weighted Voting"
          description="Express conviction from 1-5"
        />
        <FeatureCard
          icon={ShieldBan}
          title="Veto Power"
          description="Disqualify unacceptable options"
        />
        <FeatureCard
          icon={Sparkles}
          title="AI Suggestions"
          description="LLM-generated options"
        />
        <FeatureCard
          icon={Zap}
          title="No Account Required"
          description="Create and vote instantly"
        />
      </section>
    </main>
  );
}
