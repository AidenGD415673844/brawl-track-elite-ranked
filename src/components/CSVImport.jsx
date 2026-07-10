import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
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
    else if (key === "highest elo" || key === "highest elo (all-time)") playerData.highestElo = Number(val) || 0;
    else if (key === "last season highest elo") playerData.lastSeasonElo = Number(val) || 0;
    else if (key === "current season highest") playerData.currentSeasonHighest = Number(val) || 0;
    else if (key === "trophies") playerData.trophies = Number(val) || 0;
    else if (key === "win rate (%)") playerData.winRate = Number(val) || 0;
    else if (key === "games played" || key === "games played (all-time)") playerData.gamesPlayed = Number(val) || 0;
    else if (key === "self-rated skill") playerData.skill = Number(val) || 0;
    else if (key === "power 9 brawlers") playerData.power9Brawlers = Number(val) || 0;
    else if (key === "power 11 brawlers") playerData.power11Brawlers = Number(val) || 0;
  }
  return playerData;
}

export default function CSVImport({ onImport }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

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
          toast({ title: "CSV import failed", description: "No recognizable stats found.", variant: "destructive" });
          return;
        }
        onImport(data);
        toast({ title: "CSV imported", description: `${Object.keys(data).length} field${Object.keys(data).length === 1 ? "" : "s"} updated.` });
      } catch {
        setError("Failed to parse CSV. Please check the format.");
        toast({ title: "CSV import failed", description: "Could not parse the file.", variant: "destructive" });
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      toast({ title: "CSV import failed", description: "Could not read the file.", variant: "destructive" });
    };
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
