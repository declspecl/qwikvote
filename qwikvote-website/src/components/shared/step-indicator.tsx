import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

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
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                i + 1 === currentStep
                  ? "bg-primary text-primary-foreground shadow-md"
                  : i + 1 < currentStep
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1 < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={cn(
                "text-xs hidden sm:block transition-colors duration-200",
                i + 1 === currentStep
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {labels[i]}
            </span>
          </div>
          {i < totalSteps - 1 && (
            <div className="relative h-0.5 w-8 sm:w-12 mb-5 sm:mb-4 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500 ease-out",
                  i + 1 < currentStep ? "w-full" : "w-0"
                )}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
