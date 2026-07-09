import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCredentials, setCredentials, hasCredentials, clearCredentials } from "@/lib/p2pSync";
import { Check, Save, Trash2 } from "lucide-react";

export default function LiveKitSettings() {
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const creds = getCredentials();
    if (creds) {
      setUrl(creds.url || "");
      setApiKey(creds.apiKey || "");
      setApiSecret(creds.apiSecret || "");
    }
  }, []);

  const handleSave = () => {
    setCredentials(url, apiKey, apiSecret);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const configured = hasCredentials();

  const handleClear = () => {
    clearCredentials();
    setUrl("");
    setApiKey("");
    setApiSecret("");
    setSaved(false);
  };

  return (
    <div className="space-y-3">
      {configured && (
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
          <Check className="w-3 h-3" /> LiveKit credentials configured
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-[10px] uppercase text-muted-foreground">LiveKit Server URL</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="wss://your-project.livekit.cloud"
          className="bg-muted border-border text-foreground focus-visible:ring-cyan-500 text-xs h-9"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] uppercase text-muted-foreground">API Key</Label>
        <Input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="APIxxxxxxxxxxxxxxxx"
          className="bg-muted border-border text-foreground focus-visible:ring-cyan-500 text-xs h-9"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] uppercase text-muted-foreground">API Secret</Label>
        <Input
          type="password"
          value={apiSecret}
          onChange={(e) => setApiSecret(e.target.value)}
          placeholder="••••••••••••••••"
          className="bg-muted border-border text-foreground focus-visible:ring-cyan-500 text-xs h-9"
        />
      </div>

      <p className="text-[10px] text-muted-foreground">
        Credentials are stored in sessionStorage (cleared when tab closes) for security.
        Get free credentials at{" "}
        <a href="https://livekit.io/cloud" target="_blank" rel="noopener" className="text-cyan-500 underline">
          livekit.io/cloud
        </a>
      </p>

      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl">
          {saved ? <><Check className="w-4 h-4 mr-2" /> Saved!</> : <><Save className="w-4 h-4 mr-2" /> Save</>}
        </Button>
        {configured && (
          <Button onClick={handleClear} variant="outline" className="border-border rounded-xl px-3">
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        )}
      </div>
    </div>
  );
}