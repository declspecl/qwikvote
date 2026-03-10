import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SharePanel() {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-xl p-4 mt-6">
      <p className="text-sm font-medium mb-2">Share this poll</p>
      <div className="flex gap-2">
        <Input readOnly value={url} className="font-mono text-sm bg-background/50" />
        <Button
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          className="hover:bg-primary/10 transition-colors"
        >
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
