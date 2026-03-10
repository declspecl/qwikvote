import { cn } from "@/lib/utils";

interface WeightPickerProps {
  value: number;
  onChange: (weight: number) => void;
}

const weights = [1, 2, 3, 4, 5] as const;

const intensityStyles: Record<number, string> = {
  1: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  2: "bg-emerald-200 text-emerald-800 dark:bg-emerald-800/50 dark:text-emerald-200",
  3: "bg-emerald-400 text-white dark:bg-emerald-700 dark:text-emerald-100",
  4: "bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white",
  5: "gradient-bg text-white shadow-md",
};

export function WeightPicker({ value, onChange }: WeightPickerProps) {
  return (
    <div className="flex items-center gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
      <span className="text-xs text-muted-foreground mr-1">Conviction:</span>
      {weights.map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => onChange(w)}
          className={cn(
            "h-8 w-8 rounded-lg text-sm font-medium transition-all duration-200",
            w === value
              ? `${intensityStyles[w]} scale-110 ring-2 ring-primary/30`
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105"
          )}
        >
          {w}
        </button>
      ))}
    </div>
  );
}
