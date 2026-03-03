import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                i + 1 === currentStep
                  ? "bg-primary text-primary-foreground"
                  : i + 1 < currentStep
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">{labels[i]}</span>
          </div>
          {i < totalSteps - 1 && (
            <div
              className={cn(
                "h-0.5 w-8 sm:w-12 mb-5 sm:mb-4",
                i + 1 < currentStep ? "bg-primary/40" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
