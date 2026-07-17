import React, { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertOctagon, X } from "lucide-react";
import { detectTilt, dismissTilt } from "@/lib/tiltDetector";

export default function TiltAlertLive({ battleLog }) {
  const [dismissed, setDismissed] = useState(false);
  const status = useMemo(() => detectTilt(battleLog), [battleLog, dismissed]);

  useEffect(() => { setDismissed(false); }, [battleLog?.length]);

  if (!status.tilted) return null;

  const handleDismiss = () => {
    dismissTilt(15);
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative rounded-2xl border-2 border-red-500/60 bg-gradient-to-r from-red-500/15 to-orange-500/15 p-4 shadow-[0_0_30px_rgba(239,68,68,0.25)]"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-red-400 hover:text-red-200"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shrink-0 animate-pulse">
            <AlertOctagon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-display font-black text-red-400">Tilt Detected — take a break</p>
            <p className="text-[11px] text-red-200/90 mt-0.5">
              {status.streak}-game losing streak · dropped {status.dropped} Elo in the last 90 min · pressure {status.avgP}/100.
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Stepping away for 15 minutes typically reverses tilt. Dismissing snoozes this alert for 15 min.
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
