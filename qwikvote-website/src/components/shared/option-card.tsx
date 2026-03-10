import { cn } from "@/lib/utils";

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function OptionCard({ selected, onClick, children }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-all duration-200",
        "hover:translate-y-[-1px] hover:shadow-md",
        selected
          ? "border-l-4 border-l-primary ring-1 ring-primary/20 bg-primary/5 shadow-md"
          : "border-l-4 border-l-transparent hover:bg-accent/30 hover:border-l-primary/30"
      )}
    >
      {children}
    </button>
  );
}
