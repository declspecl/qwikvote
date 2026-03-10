import { cn } from "@/lib/utils";

interface WeightPickerProps {
  value: number;
  onChange: (weight: number) => void;
}

const weights = [1, 2, 3, 4, 5] as const;

const intensityStyles: Record<number, string> = {
  1: "bg-primary/10 text-primary/70",
  2: "bg-primary/20 text-primary/80",
  3: "bg-primary/40 text-primary-foreground",
  4: "bg-primary/60 text-primary-foreground",
  5: "bg-primary text-primary-foreground",
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
              ? `${intensityStyles[w]} ring-2 ring-primary/30`
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {w}
        </button>
      ))}
    </div>
  );
}
