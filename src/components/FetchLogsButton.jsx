import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle, Info, FlaskConical } from "lucide-react";
import { fetchBattles, generateMockBattles } from "@/lib/brawlStarsApi";
import { isMockDataEnabled, setMockDataEnabled } from "@/lib/appSettings";
import BackendStatusChip from "@/components/BackendStatusChip";

// FetchLogsButton — fetches ranked battle logs from the Brawl Stars API
// or generates mock data if the toggle is enabled in Settings.
export default function FetchLogsButton({ currentElo, onFetch }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emptyMsg, setEmptyMsg] = useState(false);
  const [mockEnabled, setMockEnabled] = useState(isMockDataEnabled());

  const loadMockLogs = () => {
    setMockDataEnabled(true);
    setMockEnabled(true);
    setError(null);
    setEmptyMsg(false);
    onFetch(generateMockBattles(currentElo), true);
  };

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    setEmptyMsg(false);

    try {
      const result = await fetchBattles(currentElo);

      if (result.error) {
        setError(result.error);
      } else if (result.empty) {
        setEmptyMsg(true);
      } else if (result.battles && result.battles.length > 0) {
        onFetch(result.battles, result.mock);
        setEmptyMsg(false);
      } else {
        setEmptyMsg(true);
      }
    } catch (err) {
      setError(
        err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")
          ? "Unable to reach the Brawl Stars API. This may be due to browser CORS restrictions. Try enabling Mock Data in Settings."
          : err.message || "Failed to fetch battle logs."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <BackendStatusChip probe compact />
        {mockEnabled && (
          <span className="inline-flex items-center gap-1 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-1 text-[10px] font-bold text-fuchsia-300">
            <FlaskConical className="h-3 w-3" /> Mock ready
          </span>
        )}
      </div>

      <Button
        onClick={handleClick}
        disabled={loading}
        variant="outline"
        className="w-full border-border bg-card text-foreground hover:bg-muted rounded-xl"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" /> Fetch Logs
          </>
        )}
      </Button>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2">
          <p className="text-[10px] text-red-400 flex items-start gap-1">
            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
            <span>{error}</span>
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={loadMockLogs}
            className="mt-2 h-7 w-full rounded-lg border-red-500/20 bg-card text-[10px] text-foreground hover:bg-muted"
          >
            <FlaskConical className="mr-1.5 h-3 w-3" /> Use mock logs now
          </Button>
        </div>
      )}

      {emptyMsg && (
        <p className="text-[10px] text-muted-foreground italic">
          No recent Ranked battles found.
        </p>
      )}

      <p className="text-[9px] text-muted-foreground/70 flex items-start gap-1">
        <Info className="w-2.5 h-2.5 mt-0.5 shrink-0" />
        Note: Enable mock data in settings to test with simulated player logs if you do not have an API key.
      </p>
    </div>
  );
}