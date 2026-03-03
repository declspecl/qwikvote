import { cn } from "@/lib/utils";

interface ScoreBarProps {
  score: number;
  max: number;
  className?: string;
}

export function ScoreBar({ score, max, className }: ScoreBarProps) {
  const pct = max > 0 ? (score / max) * 100 : 0;

  return (
    <div className={cn("h-3 flex-1 rounded-full bg-muted overflow-hidden", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
