import { Link } from "@tanstack/react-router";
import { Vote } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 glass border-b border-border/30">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-lg group"
        >
          <Vote className="h-5 w-5 text-primary transition-transform duration-200 group-hover:scale-110" />
          <span className="transition-all duration-200 group-hover:gradient-text">
            QwikVote
          </span>
        </Link>
        <Button
          size="sm"
          className="gradient-bg text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          render={<Link to="/create" />}
        >
          Create Poll
        </Button>
      </div>
    </header>
  );
}
