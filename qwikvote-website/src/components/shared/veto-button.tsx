import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ShieldBan } from "lucide-react";

interface VetoButtonProps {
  onVeto: () => void;
  disabled?: boolean;
}

export function VetoButton({ onVeto, disabled }: VetoButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
        >
          <ShieldBan className="h-4 w-4 mr-1" />
          Veto
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Veto this option?</AlertDialogTitle>
          <AlertDialogDescription>
            Vetoing permanently disqualifies this option from winning. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onVeto}>Confirm Veto</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
