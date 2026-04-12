import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logoSrc from "@/assets/qwikvote-logo.png";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-display font-bold text-lg tracking-tight hover:text-primary transition-colors"
        >
          <img src={logoSrc} alt="QwikVote" className="size-8 rounded-md" />
          QwikVote
        </Link>
        <Button
          size="sm"
          className="bg-primary text-primary-foreground btn-lift"
          render={<Link to="/create" />}
        >
          Create Poll
        </Button>
      </div>
    </header>
  );
}
