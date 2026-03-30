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
import { ApiError, getExplanation } from "@/lib/api-client";
import type { PollResponse, VoteResponse } from "@/lib/schemas";

const DEV_API_BASE_URL = "http://localhost:8000";

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
        <h1 className="font-display text-2xl font-bold">Poll Not Found</h1>
        <p className="text-muted-foreground">
          This poll doesn't exist or may have been removed.
        </p>
        <Button className="bg-primary text-primary-foreground btn-lift" render={<Link to="/create" />}>
          Create a Poll
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center space-y-4 animate-fade-in-up">
      <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
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
  const [explanation, setExplanation] = useState<string | null>(null); 
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  if (poll.status === "closed") {
    return <PollFinalResults poll={poll} pollId={pollId} explanation={explanation}
        setExplanation={setExplanation}
        loadingExplanation={loadingExplanation}
        setLoadingExplanation={setLoadingExplanation}/>;
  }

  if (hasVoted(pollId)) {
    return <PollLiveResults poll={poll} pollId={pollId} />;
  }

  return <PollVotingView poll={poll} pollId={pollId} />;
}

function PollVotingView({ poll, pollId}: { poll: PollResponse; pollId: string;}) {
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

  if (scores) {
    return <PollLiveResults poll={poll} pollId={pollId} initialScores={scores} />;
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8 animate-fade-in-up">
      <div className="space-y-2 mb-6">
        <h1 className="font-display text-3xl font-bold">{poll.title}</h1>
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
        className="w-full mt-6 bg-primary text-primary-foreground btn-lift btn-glow"
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
      <Badge className="mb-4 bg-primary text-primary-foreground border-0">Your vote is in!</Badge>
      <h1 className="font-display text-2xl font-bold mb-6">{poll.title}</h1>

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
        className="mt-8 btn-lift"
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

function PollFinalResults({ poll, pollId,explanation,
  setExplanation,
  loadingExplanation,
  setLoadingExplanation,  }: { poll: PollResponse; pollId: string; explanation: string | null;
  setExplanation: (text: string | null) => void;
  loadingExplanation: boolean;
  setLoadingExplanation: (loading: boolean) => void; }) {
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
      <Badge className="mb-4 bg-primary text-primary-foreground border-0">Poll Closed</Badge>
      <h1 className="font-display text-2xl font-bold mb-6">{poll.title}</h1>

      {results.winner_text && (
        <Card className="mb-6 overflow-hidden border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display">
              <Trophy className="h-6 w-6 text-primary" />
              Winner
            </CardTitle>
          </CardHeader>
          <CardContent>
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

      <Card className="mt-4">
        <CardContent className="p-4">
          <Button
            onClick={async () => {
              setLoadingExplanation(true);
              try {
                const res = await fetch(`${DEV_API_BASE_URL}/llm/explain`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    poll_id: poll.poll_id,
                    title: poll.title,
                    options: poll.options.map(o => o.text),
                    scores: results.scores,
                  }),
                });
                const data = await res.json();
                setExplanation(data.explanation);
              } catch (e) {
                console.error(e);
              } finally {
                setLoadingExplanation(false);
              }
            }}
          >
            Explain Results (AI)
          </Button>

          {loadingExplanation && (
            <p className="text-sm mt-2 text-muted-foreground">Thinking...</p>
          )}

          {explanation && (
            <p className="mt-3 text-sm text-muted-foreground">
              {explanation}
            </p>
          )}
        </CardContent>
      </Card>
      

      <div className="space-y-3">
        {sortedOptions.map((opt, rank) => {
          const score = scores[opt.option_id] ?? 0;
          const isVetoed = results.veto_disqualified.includes(opt.option_id);
          const isTopThree = rank < 3 && !isVetoed;
          return (
            <div
              key={opt.option_id}
              className={`flex items-center gap-3 transition-opacity reveal`}
              style={{
                animationDelay: `${rank * 80}ms`,
                opacity: isVetoed ? 0.4 : undefined,
              }}
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
