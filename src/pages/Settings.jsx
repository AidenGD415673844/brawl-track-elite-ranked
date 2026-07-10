import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon, ArrowLeft, Radio, ShieldAlert, Zap, Vibrate } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/lib/ThemeContext";
import LiveKitSettings from "@/components/LiveKitSettings";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  isTiltLockEnabled, setTiltLockEnabled,
  getTiltLockThreshold, setTiltLockThreshold,
} from "@/lib/rankUp";
import { areHapticsEnabled, setHapticsEnabled, vibratePromotion } from "@/lib/haptics";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [tiltLock, setTiltLock] = React.useState(isTiltLockEnabled());
  const [threshold, setThreshold] = React.useState(getTiltLockThreshold());
  const [haptics, setHaptics] = React.useState(areHapticsEnabled());
  const [perfMode, setPerfMode] = React.useState(() => {
    try { return localStorage.getItem("tierAnimPerf") || "auto"; } catch { return "auto"; }
  });
  const updatePerf = (mode) => {
    setPerfMode(mode);
    try {
      if (mode === "auto") localStorage.removeItem("tierAnimPerf");
      else localStorage.setItem("tierAnimPerf", mode);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <Card className="bg-card border-border p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-purple-600 flex items-center justify-center">
                {theme === "dark" ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Theme</h3>
                <p className="text-xs text-muted-foreground">Switch between dark and light mode</p>
              </div>
            </div>
            <Button
              onClick={toggleTheme}
              variant="outline"
              className="rounded-xl border-border bg-card text-foreground hover:bg-muted"
            >
              {theme === "dark" ? (<><Sun className="w-4 h-4 mr-2" /> Light Mode</>) : (<><Moon className="w-4 h-4 mr-2" /> Dark Mode</>)}
            </Button>
          </div>
        </Card>

        <Card className="bg-card border-border p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">P2P Sync (LiveKit)</h3>
              <p className="text-xs text-muted-foreground">Connect with friends via WebRTC data channels</p>
            </div>
          </div>
          <LiveKitSettings />
        </Card>

        <Card className="bg-card border-border p-5 rounded-2xl">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Anti-Tilt Lock</h3>
                <p className="text-xs text-muted-foreground">
                  Confirm before logging a battle when on a losing streak
                </p>
              </div>
            </div>
            <Switch
              checked={tiltLock}
              onCheckedChange={(v) => { setTiltLock(v); setTiltLockEnabled(v); }}
            />
          </div>
          <div className={tiltLock ? "" : "opacity-40 pointer-events-none"}>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-muted-foreground">Streak threshold</span>
              <span className="font-display font-bold text-rose-500">{threshold} losses</span>
            </div>
            <Slider
              min={2} max={8} step={1}
              value={[threshold]}
              onValueChange={(v) => { setThreshold(v[0]); setTiltLockThreshold(v[0]); }}
            />
          </div>
        </Card>

        <Card className="bg-card border-border p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Tier Animation Performance</h3>
              <p className="text-xs text-muted-foreground">
                Auto reduces heavy tier auras on low-power devices. Force high for full effects, low to save battery.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["auto", "high", "low"].map((mode) => (
              <Button
                key={mode}
                onClick={() => updatePerf(mode)}
                variant={perfMode === mode ? "default" : "outline"}
                className="rounded-xl capitalize"
              >
                {mode}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
