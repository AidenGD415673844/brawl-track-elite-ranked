import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Lock, ServerCrash } from "lucide-react";
import { getBackendConfigStatus, probeBackendFunction } from "@/lib/backendStatus";

const styles = {
  ready: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  configured: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  "auth-required": "border-amber-500/30 bg-amber-500/10 text-amber-400",
  "missing-config": "border-red-500/30 bg-red-500/10 text-red-400",
  "function-error": "border-orange-500/30 bg-orange-500/10 text-orange-400",
  "client-error": "border-red-500/30 bg-red-500/10 text-red-400",
};

function StatusIcon({ state }) {
  if (state === "ready" || state === "configured") return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (state === "auth-required") return <Lock className="h-3.5 w-3.5" />;
  if (state === "missing-config" || state === "client-error") return <ServerCrash className="h-3.5 w-3.5" />;
  return <AlertTriangle className="h-3.5 w-3.5" />;
}

export default function BackendStatusChip({ probe = false, compact = false }) {
  const [status, setStatus] = useState(() => getBackendConfigStatus());

  useEffect(() => {
    let cancelled = false;
    if (!probe) return undefined;

    probeBackendFunction("livekit-token", { roomName: "probe", identity: "probe" }).then((next) => {
      if (!cancelled) setStatus(next);
    });

    return () => {
      cancelled = true;
    };
  }, [probe]);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-bold ${styles[status.state] || styles["function-error"]}`}
      title={status.detail}
    >
      <StatusIcon state={status.state} />
      {compact ? status.label.replace("Backend ", "") : status.label}
    </span>
  );
}