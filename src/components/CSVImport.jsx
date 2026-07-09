import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const playerData = {};

  for (const line of lines) {
    const cols = parseCSVLine(line);
    if (cols.length < 2) continue;
    const key = cols[0]?.trim().toLowerCase();
    const val = cols[1]?.trim();

    if (key === "current elo") playerData.currentElo = Number(val) || 0;
    else if (key === "highest elo") playerData.highestElo = Number(val) || 0;
    else if (key === "last season highest elo") playerData.lastSeasonElo = Number(val) || 0;
    else if (key === "current season highest") playerData.currentSeasonHighest = Number(val) || 0;
    else if (key === "trophies") playerData.trophies = Number(val) || 0;
    else if (key === "win rate (%)") playerData.winRate = Number(val) || 0;
    else if (key === "games played") playerData.gamesPlayed = Number(val) || 0;
    else if (key === "self-rated skill") playerData.skill = Number(val) || 0;
  }
  return playerData;
}

export default function CSVImport({ onImport }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const data = parseCSV(text);
        if (Object.keys(data).length === 0) {
          setError("No recognizable stats found in CSV.");
          return;
        }
        onImport(data);
      } catch {
        setError("Failed to parse CSV. Please check the format.");
      }
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        className="border-border bg-card text-foreground hover:bg-muted rounded-xl"
      >
        <UploadCloud className="w-4 h-4 mr-2" /> Import CSV
      </Button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}