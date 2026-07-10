import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Radio, Copy, Check, Users, Wifi, WifiOff } from "lucide-react";
import {
  createRoom, joinRoom, isConnected, getCurrentRoom, disconnect,
} from "@/lib/p2pSync";

// Minimal room create/join UI. Uses the existing p2pSync module — no
// LiveKit configuration needed. Cross-tab sync works out of the box.
export default function RoomLobby() {
  const [roomName, setRoomName] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setConnected(isConnected());
    setRoomName(getCurrentRoom() || "");
    const i = setInterval(() => {
      setConnected(isConnected());
      setRoomName(getCurrentRoom() || "");
    }, 2000);
    return () => clearInterval(i);
  }, []);

  const handleCreate = async () => {
    setBusy(true); setError("");
    try {
      const name = await createRoom();
      setRoomName(name); setConnected(true);
    } catch { setError("Could not create room."); }
    setBusy(false);
  };

  const handleJoin = async () => {
    if (!joinInput.trim()) return;
    setBusy(true); setError("");
    try {
      const code = joinInput.trim().toUpperCase();
      await joinRoom(code);
      setRoomName(code); setConnected(true);
    } catch { setError("Invalid room code."); }
    setBusy(false);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(roomName);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLeave = () => {
    disconnect();
    setConnected(false); setRoomName(""); setJoinInput("");
  };

  return (
    <Card className="bg-card border-border p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-display font-semibold text-foreground">Room</h3>
            <p className="text-[10px] text-muted-foreground">Share battles live with a friend</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${
          connected ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
        }`}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {connected ? "IN ROOM" : "OFFLINE"}
        </div>
      </div>

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
          <Button variant="outline" size="sm" onClick={handleLeave} className="w-full border-border rounded-xl">
            Leave Room
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Button onClick={handleCreate} disabled={busy}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-display font-bold rounded-xl">
            <Radio className="w-4 h-4 mr-2" />
            {busy ? "Creating..." : "Create Room"}
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground px-2">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex gap-2">
            <Input value={joinInput} onChange={(e) => setJoinInput(e.target.value)}
              placeholder="Enter room code..."
              className="bg-muted border-border text-foreground focus-visible:ring-cyan-500 text-xs h-9"
              onKeyDown={(e) => e.key === "Enter" && handleJoin()} />
            <Button onClick={handleJoin} disabled={busy || !joinInput.trim()} variant="outline"
              className="border-border bg-card text-foreground hover:bg-muted rounded-xl px-4">
              Join
            </Button>
          </div>
          {error && <p className="text-[10px] text-red-500">{error}</p>}
        </div>
      )}
    </Card>
  );
}
