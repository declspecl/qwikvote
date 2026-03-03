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
        "w-full rounded-lg border p-4 text-left transition-all",
        "hover:bg-accent/50",
        selected && "ring-2 ring-primary border-primary bg-accent/30"
      )}
    >
      {children}
    </button>
  );
}
