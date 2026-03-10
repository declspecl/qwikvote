import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          to="/"
          className="font-display font-bold text-lg tracking-tight hover:text-primary transition-colors"
        >
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
