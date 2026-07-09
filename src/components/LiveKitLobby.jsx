import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Radio, Copy, Check, Users, Wifi, WifiOff } from "lucide-react";
import {
  createRoom,
  joinRoom,
  isConnected,
  getCurrentRoom,
  hasCredentials,
  disconnect,
} from "@/lib/p2pSync";
import { motion } from "framer-motion";

export default function LiveKitLobby() {
  const [roomName, setRoomName] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [hasCreds, setHasCreds] = useState(false);

  useEffect(() => {
    setHasCreds(hasCredentials());
    setConnected(isConnected());
    setRoomName(getCurrentRoom() || "");
    const interval = setInterval(() => {
      setConnected(isConnected());
      setRoomName(getCurrentRoom() || "");
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    try {
      const name = await createRoom();
      setRoomName(name);
      setConnected(true);
    } catch {
      setError("Failed to create room. Check your LiveKit settings.");
    }
    setCreating(false);
  };

  const handleJoin = async () => {
    if (!joinInput.trim()) return;
    setCreating(true);
    setError("");
    try {
      await joinRoom(joinInput.trim().toUpperCase());
      setRoomName(joinInput.trim().toUpperCase());
      setConnected(true);
    } catch {
      setError("Failed to join room. Check the room code and your LiveKit settings.");
    }
    setCreating(false);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(roomName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    disconnect();
    setConnected(false);
    setRoomName("");
    setJoinInput("");
  };

  return (
    <Card className="bg-card border-border p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-display font-semibold text-foreground">P2P Sync Lobby</h3>
            <p className="text-[10px] text-muted-foreground">
              Real-time battle sync via WebRTC
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${
          connected ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
        }`}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {connected ? "CONNECTED" : "OFFLINE"}
        </div>
      </div>

      {!hasCreds && (
        <p className="text-[10px] text-yellow-500 mb-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
          ⚠️ Configure LiveKit credentials in Settings for cross-device sync. Local sync (same browser) works without configuration.
        </p>
      )}

      {connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-3">
            <Users className="w-4 h-4 text-cyan-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase">Room Code</p>
              <p className="text-sm font-bold text-foreground truncate">{roomName}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 px-2">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Share this code with your friend. Battles you log will instantly appear on their device.
          </p>
          <Button variant="outline" size="sm" onClick={handleDisconnect} className="w-full border-border rounded-xl">
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-display font-bold rounded-xl"
          >
            <Radio className="w-4 h-4 mr-2" />
            {creating ? "Creating..." : "Create Room"}
          </Button>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground px-2">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex gap-2">
            <Input
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              placeholder="Paste room code..."
              className="bg-muted border-border text-foreground focus-visible:ring-cyan-500 text-xs h-9"
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <Button
              onClick={handleJoin}
              disabled={creating || !joinInput.trim()}
              variant="outline"
              className="border-border bg-card text-foreground hover:bg-muted rounded-xl px-4"
            >
              Join
            </Button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-red-500"
            >
              {error}
            </motion.p>
          )}
        </div>
      )}
    </Card>
  );
}