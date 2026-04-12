import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import Markdown from "react-markdown";
import { Trophy, Dice6, Medal, Loader2, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { ApiError, getPoll as fetchPoll } from "@/lib/api-client";
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

  if (error instanceof ApiError && error.status === 403) {
    return <PasswordGate />;
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

function PasswordGate() {
  const { pollId } = Route.useParams();
  const { setPassword: storePassword } = usePasswordStore();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError(false);

    try {
      // Test the password before committing to it
      await fetchPoll(pollId, password);

      // Password is correct — store it so all future fetches use it
      storePassword(pollId, password);

      // Clear cached error + refetch with the stored password
      queryClient.removeQueries({ queryKey: ["polls", pollId] });
      await router.invalidate();
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setError(true);
      }
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto max-w-md px-4 py-16 animate-fade-in-up">
      <Card className="surface">
        <CardContent className="p-8 text-center space-y-5">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">This poll is locked</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the password to view and vote on this poll.
            </p>
          </div>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              className={`bg-background/50 ${error ? "border-destructive ring-1 ring-destructive/30" : ""}`}
            />
            {error && (
              <p className="text-sm text-destructive">Wrong password — try again</p>
            )}
            <Button
              className="w-full bg-primary text-primary-foreground btn-lift"
              onClick={handleUnlock}
              disabled={loading || !password.trim()}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {loading ? "Checking..." : "Unlock Poll"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
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
  const { isOwner } = useVoteStore();
  const scores = initialScores ?? {};
  const hasScores = Object.values(scores).some((v) => v > 0);
  const maxScore = Math.max(...Object.values(scores), 1);
  const ownsThisPoll = isOwner(pollId);

  const handleClose = () => {
    const pw = getPassword(pollId);
    closePoll.mutate({ password: pw });
  };

  if (closePoll.isPending) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-16 animate-fade-in-up">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <h1 className="font-display text-2xl font-bold">Closing poll...</h1>
          <p className="text-muted-foreground">
            Calculating results and generating AI analysis. This may take a moment.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8 animate-fade-in-up">
      <Badge className="mb-4 bg-primary text-primary-foreground border-0">Your vote is in!</Badge>
      <h1 className="font-display text-2xl font-bold mb-2">{poll.title}</h1>
      {poll.description && (
        <p className="text-muted-foreground mb-6">{poll.description}</p>
      )}

      {hasScores ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Scores as of your vote — final results will appear once the poll is closed.
          </p>
          <div className="space-y-3">
            {poll.options.map((opt, i) => {
              const score = scores[opt.option_id] ?? 0;
              return (
                <div key={opt.option_id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{opt.text}</span>
                    <span className="text-sm font-medium text-muted-foreground ml-3 shrink-0">
                      {score}
                    </span>
                  </div>
                  <ScoreBar score={score} max={maxScore} delay={i} />
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Waiting for the poll to close. Final results will appear here.
          </p>
          <div className="space-y-2">
            {poll.options.map((opt) => (
              <div key={opt.option_id} className="surface p-3 text-sm font-medium">
                {opt.text}
              </div>
            ))}
          </div>
        </>
      )}

      {ownsThisPoll && (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive"
                className="mt-8 btn-lift"
              />
            }
          >
            Close Poll
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Close this poll?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently end voting for all participants and calculate
                the final results. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Open</AlertDialogCancel>
              <AlertDialogAction onClick={handleClose}>
                Close Poll
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <SharePanel />
    </main>
  );
}

const MEDAL_COLORS = ["text-yellow-500", "text-gray-400", "text-amber-600"];

function PollFinalResults({ poll }: { poll: PollResponse }) {
  const results = poll.results;

  if (!results) return null;

  const explanation = results.ai_explanation ?? null;

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

      <div className="space-y-3">
        {sortedOptions.map((opt, rank) => {
          const score = scores[opt.option_id] ?? 0;
          const isVetoed = results.veto_disqualified.includes(opt.option_id);
          const isTopThree = rank < 3 && !isVetoed;
          return (
            <div
              key={opt.option_id}
              className={`transition-opacity reveal`}
              style={{
                animationDelay: `${rank * 80}ms`,
                opacity: isVetoed ? 0.4 : undefined,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 flex items-center justify-center shrink-0">
                  {isTopThree ? (
                    <Medal className={`h-4 w-4 ${MEDAL_COLORS[rank]}`} />
                  ) : (
                    <span className="text-sm text-muted-foreground">#{rank + 1}</span>
                  )}
                </span>
                <span className={`text-sm font-medium ${isVetoed ? "line-through text-destructive/70" : ""}`}>
                  {opt.text}
                </span>
                {isVetoed && (
                  <Badge variant="destructive" className="text-xs shrink-0">
                    Vetoed
                  </Badge>
                )}
                <span className="ml-auto text-sm font-medium text-muted-foreground shrink-0">
                  {score}
                </span>
              </div>
              <div className="pl-8">
                <ScoreBar score={score} max={maxScore} delay={rank} />
              </div>
            </div>
          );
        })}
      </div>

      {explanation && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Analysis</span>
            </div>
            <div className="prose prose-sm max-w-none text-sm text-muted-foreground [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-foreground [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_strong]:text-foreground [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_p]:my-1.5">
              <Markdown>{explanation}</Markdown>
            </div>
          </CardContent>
        </Card>
      )}

      <SharePanel />
    </main>
  );
}
