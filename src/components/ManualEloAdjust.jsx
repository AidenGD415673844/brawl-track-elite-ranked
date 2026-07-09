import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sliders } from "lucide-react";

// ManualEloAdjust — single text box where you type the signed delta
// (e.g. "+10" or "-10") and press Apply or Enter.
export default function ManualEloAdjust({ onAdjust }) {
  const [value, setValue] = useState("");

  const parseAndAdjust = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const n = parseInt(trimmed, 10);
    if (isNaN(n) || n === 0) return;
    onAdjust(n);
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      parseAndAdjust();
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
      <div className="flex items-center gap-2">
        <Sliders className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-[10px] uppercase text-muted-foreground font-display">Manual Elo Adjust</span>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || /^[+-]?\d*$/.test(val)) {
              setValue(val);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="+10 or -10"
          className="bg-muted border-border text-foreground focus-visible:ring-cyan-500 text-xs h-8"
        />
        <Button
          size="sm"
          onClick={parseAndAdjust}
          disabled={!value || parseInt(value, 10) === 0 || isNaN(parseInt(value, 10))}
          className="bg-cyan-500 hover:bg-cyan-400 text-white px-3 h-8"
        >
          Apply
        </Button>
      </div>
    </div>
  );
}