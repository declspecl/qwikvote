import { Link } from "@tanstack/react-router";
import { Vote } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
          <Vote className="h-5 w-5" />
          QwikVote
        </Link>
        <Button size="sm" render={<Link to="/create" />}>
          Create Poll
        </Button>
      </div>
    </header>
  );
}
