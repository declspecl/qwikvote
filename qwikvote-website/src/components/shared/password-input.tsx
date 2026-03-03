import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function PasswordInput({ value, onChange }: PasswordInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="poll-password">Password</Label>
      <Input
        id="poll-password"
        type="password"
        placeholder="Enter poll password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
