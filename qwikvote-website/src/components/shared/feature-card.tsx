interface FeatureCardProps {
  graphic: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({ graphic, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <div
      className="surface p-8 text-left btn-lift cursor-default reveal"
      style={{ animationDelay: `${500 + delay * 80}ms` }}
    >
      <div className="mb-4">{graphic}</div>
      <h3 className="font-display text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
