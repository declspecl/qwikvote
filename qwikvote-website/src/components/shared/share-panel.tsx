import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="mt-6">
      <CardContent className="p-4">
        <p className="text-sm font-medium mb-2">Share this poll</p>
        <div className="flex gap-2">
          <Input readOnly value={url} className="font-mono text-sm" />
          <Button variant="outline" size="icon" onClick={copyToClipboard}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
