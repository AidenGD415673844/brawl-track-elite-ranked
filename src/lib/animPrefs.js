// Battle-card particle preferences. Backed by localStorage.
// - particlesEnabled: master on/off switch
// - particleIntensity: 'low' | 'medium' | 'high' (default 'medium')
import { useEffect, useState } from "react";

const ENABLED_KEY = "bt.particlesEnabled";
const INTENSITY_KEY = "bt.particleIntensity";
const EVENT = "bt.animPrefsChanged";

function readEnabled() {
  try {
    const v = localStorage.getItem(ENABLED_KEY);
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

function readIntensity() {
  try {
    const v = localStorage.getItem(INTENSITY_KEY);
    if (v === "low" || v === "medium" || v === "high") return v;
    return "medium";
  } catch {
    return "medium";
  }
}

export function getParticlesEnabled() {
  return readEnabled();
}
export function setParticlesEnabled(v) {
  try {
    localStorage.setItem(ENABLED_KEY, v ? "1" : "0");
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}
export function getParticleIntensity() {
  return readIntensity();
}
export function setParticleIntensity(v) {
  try {
    localStorage.setItem(INTENSITY_KEY, v);
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

export function intensityScale(intensity) {
  if (intensity === "low") return 0.5;
  if (intensity === "high") return 1.5;
  return 1;
}

export function useAnimPrefs() {
  const [prefs, setPrefs] = useState(() => ({
    enabled: readEnabled(),
    intensity: readIntensity(),
  }));
  useEffect(() => {
    const sync = () =>
      setPrefs({ enabled: readEnabled(), intensity: readIntensity() });
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return prefs;
}
