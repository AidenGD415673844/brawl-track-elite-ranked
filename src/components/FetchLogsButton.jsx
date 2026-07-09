import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle, Info } from "lucide-react";
import { fetchBattles } from "@/lib/brawlStarsApi";
import { isMockDataEnabled } from "@/lib/appSettings";

// FetchLogsButton — fetches ranked battle logs from the Brawl Stars API
// or generates mock data if the toggle is enabled in Settings.
export default function FetchLogsButton({ currentElo, onFetch }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emptyMsg, setEmptyMsg] = useState(false);
  const mockEnabled = isMockDataEnabled();

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
        <p className="text-[10px] text-red-500 flex items-start gap-1">
          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
          {error}
        </p>
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