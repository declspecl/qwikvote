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
    <div className={cn("h-3 flex-1 rounded-full bg-muted/60 overflow-hidden", className)}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${pct}%`,
          background: "linear-gradient(90deg, oklch(0.72 0.19 140), oklch(0.55 0.17 160), oklch(0.50 0.15 180))",
          animation: `score-fill 0.8s ease-out ${delay * 0.1}s both`,
        }}
      />
    </div>
  );
}
