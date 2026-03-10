import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <div
      className="glass rounded-xl p-6 text-center group hover:scale-[1.03] hover:shadow-lg transition-all duration-300 cursor-default"
      style={{ animation: `fade-in-up 0.5s ease-out ${0.5 + delay * 0.1}s both` }}
    >
      <div className="mx-auto mb-3 h-12 w-12 rounded-lg gradient-bg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
