import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Trophy, Dice6, Medal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OptionCard } from "@/components/shared/option-card";
import { WeightPicker } from "@/components/shared/weight-picker";
import { VetoButton } from "@/components/shared/veto-button";
import { ScoreBar } from "@/components/shared/score-bar";
import { SharePanel } from "@/components/shared/share-panel";
import { PasswordInput } from "@/components/shared/password-input";
import { ConfettiOverlay } from "@/components/shared/confetti-overlay";
import { PollSkeleton } from "@/components/shared/poll-skeleton";
import { pollQueryOptions, useSubmitVote, useClosePoll } from "@/features/poll/queries";
import { useVoteStore } from "@/stores/vote-store";
import { usePasswordStore } from "@/stores/password-store";
import { queryClient } from "@/lib/query-client";
import { ApiError } from "@/lib/api-client";
import type { PollResponse, VoteResponse } from "@/lib/schemas";

export const Route = createFileRoute("/poll/$pollId")({
  loader: ({ params }) =>
    queryClient.ensureQueryData(pollQueryOptions(params.pollId)),
  pendingComponent: PollSkeleton,
  errorComponent: PollError,
  component: PollPage,
});

function PollError({ error }: { error: Error }) {
  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center space-y-4 animate-fade-in-up">
        <h1 className="text-2xl font-bold">Poll Not Found</h1>
        <p className="text-muted-foreground">
          This poll doesn't exist or may have been removed.
        </p>
        <Button className="gradient-bg text-white" render={<Link to="/create" />}>
          Create a Poll
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center space-y-4 animate-fade-in-up">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground">{error.message}</p>
      <Button variant="outline" render={<Link to="/" />}>
        Go Home
      </Button>
    </div>
  );
}

function PollPage() {
  const { pollId } = Route.useParams();
  const { data: poll } = useSuspenseQuery(pollQueryOptions(pollId));
  const { hasVoted } = useVoteStore();

  if (poll.status === "closed") {
    return <PollFinalResults poll={poll} />;
  }

  if (hasVoted(pollId)) {
    return <PollLiveResults poll={poll} pollId={pollId} />;
  }

  return <PollVotingView poll={poll} pollId={pollId} />;
}

function PollVotingView({ poll, pollId }: { poll: PollResponse; pollId: string }) {
  const { selectedOptionId, weight, setSelection, setWeight, markVoted, reset } =
    useVoteStore();
  const { getPassword, setPassword: storePassword } = usePasswordStore();
  const submitVote = useSubmitVote(pollId);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState(getPassword(pollId) ?? "");
  const [scores, setScores] = useState<Record<string, number> | null>(null);

  const handleVeto = (optionId: string) => {
    const pw = password || getPassword(pollId);
    submitVote.mutate(
      {
        option_id: optionId,
        weight: 1,
        is_veto: true,
        password: pw || null,
      },
      {
        onSuccess: (data: VoteResponse) => {
          setScores(data.current_scores);
          markVoted(pollId);
          reset();
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 403) {
            setShowPassword(true);
            toast.error("Incorrect password");
          }
        },
      }
    );
  };

  const handleSubmit = () => {
    if (!selectedOptionId) return;
    const pw = password || getPassword(pollId);
    submitVote.mutate(
      {
        option_id: selectedOptionId,
        weight: poll.config.weighted_voting ? weight : 1,
        is_veto: false,
        password: pw || null,
      },
      {
        onSuccess: (data: VoteResponse) => {
          if (pw) storePassword(pollId, pw);
          setScores(data.current_scores);
          markVoted(pollId);
          reset();
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 403) {
            setShowPassword(true);
            toast.error("Incorrect password");
          }
        },
      }
    );
  };

  // If we just voted and have scores, show live results inline
  if (scores) {
    return <PollLiveResults poll={poll} pollId={pollId} initialScores={scores} />;
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8 animate-fade-in-up">
      <div className="space-y-2 mb-6">
        <div className="h-1 w-16 gradient-bg rounded-full mb-4" />
        <h1 className="text-2xl font-bold">{poll.title}</h1>
        {poll.description && (
          <p className="text-muted-foreground">{poll.description}</p>
        )}
      </div>

      <div className="space-y-3">
        {poll.options.map((opt) => (
          <OptionCard
            key={opt.option_id}
            selected={selectedOptionId === opt.option_id}
            onClick={() => setSelection(opt.option_id)}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{opt.text}</span>
              {poll.config.veto_enabled && (
                <VetoButton
                  onVeto={() => handleVeto(opt.option_id)}
                  disabled={submitVote.isPending}
                />
              )}
            </div>
            {poll.config.weighted_voting && selectedOptionId === opt.option_id && (
              <WeightPicker value={weight} onChange={setWeight} />
            )}
          </OptionCard>
        ))}
      </div>

      {showPassword && (
        <div className="mt-4">
          <PasswordInput value={password} onChange={setPassword} />
        </div>
      )}

      <Button
        className="w-full mt-6 gradient-bg text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.01]"
        size="lg"
        onClick={handleSubmit}
        disabled={!selectedOptionId || submitVote.isPending}
      >
        {submitVote.isPending ? "Submitting..." : "Submit Vote"}
      </Button>

      <SharePanel />
    </main>
  );
}

function PollLiveResults({
  poll,
  pollId,
  initialScores,
}: {
  poll: PollResponse;
  pollId: string;
  initialScores?: Record<string, number>;
}) {
  const closePoll = useClosePoll(pollId);
  const { getPassword } = usePasswordStore();
  const scores = initialScores ?? {};
  const maxScore = Math.max(...Object.values(scores), 1);

  const handleClose = () => {
    const pw = getPassword(pollId);
    closePoll.mutate({ password: pw });
  };

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8 animate-fade-in-up">
      <Badge className="mb-4 gradient-bg text-white border-0">Your vote is in!</Badge>
      <h1 className="text-2xl font-bold mb-6">{poll.title}</h1>

      <div className="space-y-3">
        {poll.options.map((opt, i) => {
          const score = scores[opt.option_id] ?? 0;
          return (
            <div key={opt.option_id} className="flex items-center gap-3">
              <span className="w-32 truncate text-sm font-medium">{opt.text}</span>
              <ScoreBar score={score} max={maxScore} delay={i} />
              <span className="w-10 text-right text-sm font-medium text-muted-foreground">
                {score}
              </span>
            </div>
          );
        })}
      </div>

      <Button
        variant="destructive"
        className="mt-8 transition-all duration-200 hover:shadow-[0_0_15px_oklch(0.577_0.245_27.325_/_0.3)]"
        onClick={handleClose}
        disabled={closePoll.isPending}
      >
        {closePoll.isPending ? "Closing..." : "Close Poll"}
      </Button>

      <SharePanel />
    </main>
  );
}

const MEDAL_COLORS = ["text-yellow-500", "text-gray-400", "text-amber-600"];

function PollFinalResults({ poll }: { poll: PollResponse }) {
  const results = poll.results;
  if (!results) return null;

  const scores = results.scores;
  const maxScore = Math.max(...Object.values(scores), 1);

  const sortedOptions = [...poll.options].sort(
    (a, b) => (scores[b.option_id] ?? 0) - (scores[a.option_id] ?? 0)
  );

  const isRandomTieBreak = results.result_justification
    .toLowerCase()
    .includes("random");

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8 animate-fade-in-up">
      <ConfettiOverlay />
      <Badge className="mb-4 gradient-bg text-white border-0">Poll Closed</Badge>
      <h1 className="text-2xl font-bold mb-6">{poll.title}</h1>

      {results.winner_text && (
        <Card className="mb-6 overflow-hidden relative">
          <div className="absolute inset-0 rounded-xl" style={{
            background: "linear-gradient(135deg, oklch(0.85 0.15 85), oklch(0.80 0.12 60), oklch(0.75 0.10 45))",
            opacity: 0.1,
          }} />
          <div className="absolute inset-0 rounded-xl ring-2 ring-yellow-500/30" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" style={{ animation: "float 3s ease-in-out infinite" }} />
              Winner
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-lg font-semibold">{results.winner_text}</p>
            {results.result_justification && (
              <p className="text-sm text-muted-foreground mt-1">
                {results.result_justification}
              </p>
            )}
            {isRandomTieBreak && (
              <Badge variant="outline" className="mt-2">
                <Dice6 className="h-3 w-3 mr-1" />
                Tie broken by Random.org
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {sortedOptions.map((opt, rank) => {
          const score = scores[opt.option_id] ?? 0;
          const isVetoed = results.veto_disqualified.includes(opt.option_id);
          const isTopThree = rank < 3 && !isVetoed;
          return (
            <div
              key={opt.option_id}
              className={`flex items-center gap-3 transition-opacity ${isVetoed ? "opacity-40" : ""}`}
              style={{ animation: `fade-in-up 0.4s ease-out ${rank * 0.08}s both` }}
            >
              <span className="w-6 flex items-center justify-center">
                {isTopThree ? (
                  <Medal className={`h-4 w-4 ${MEDAL_COLORS[rank]}`} />
                ) : (
                  <span className="text-sm text-muted-foreground">#{rank + 1}</span>
                )}
              </span>
              <span className={`w-32 truncate text-sm font-medium ${isVetoed ? "line-through text-destructive/70" : ""}`}>
                {opt.text}
              </span>
              <ScoreBar score={score} max={maxScore} delay={rank} />
              <span className="w-10 text-right text-sm font-medium text-muted-foreground">
                {score}
              </span>
              {isVetoed && (
                <Badge variant="destructive" className="text-xs">
                  Vetoed
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      <SharePanel />
    </main>
  );
}
