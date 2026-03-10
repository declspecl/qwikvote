import { cn } from "@/lib/utils";

interface ScoreBarProps {
  score: number;
  max: number;
  className?: string;
  delay?: number;
}

export function ScoreBar({ score, max, className, delay = 0 }: ScoreBarProps) {
  const pct = max > 0 ? (score / max) * 100 : 0;

  return (
    <div className={cn("h-3 flex-1 rounded-full bg-muted overflow-hidden", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
        style={{
          width: `${pct}%`,
          animation: `score-fill 0.8s ease-out ${delay * 0.1}s both`,
        }}
      />
    </div>
  );
}
