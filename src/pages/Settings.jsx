import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon, ArrowLeft, Radio, FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/lib/ThemeContext";
import LiveKitSettings from "@/components/LiveKitSettings";
import { Switch } from "@/components/ui/switch";
import { isMockDataEnabled, setMockDataEnabled } from "@/lib/appSettings";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [mockData, setMockDataState] = React.useState(isMockDataEnabled());

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
                {theme === "dark" ? (
                  <Moon className="w-5 h-5 text-white" />
                ) : (
                  <Sun className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Theme</h3>
                <p className="text-xs text-muted-foreground">
                  Switch between dark and light mode
                </p>
              </div>
            </div>
            <Button
              onClick={toggleTheme}
              variant="outline"
              className="rounded-xl border-border bg-card text-foreground hover:bg-muted"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4 mr-2" /> Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 mr-2" /> Dark Mode
                </>
              )}
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
              <p className="text-xs text-muted-foreground">
                Connect with friends via WebRTC data channels
              </p>
            </div>
          </div>
          <LiveKitSettings />
        </Card>

        <Card className="bg-card border-border p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Enable Mock Data</h3>
                <p className="text-xs text-muted-foreground">
                  Use simulated player logs instead of the Brawl Stars API
                </p>
              </div>
            </div>
            <Switch
              checked={mockData}
              onCheckedChange={(checked) => {
                setMockDataState(checked);
                setMockDataEnabled(checked);
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}