"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const THEME_KEY = "herepath:theme";
const THEME_EVENT = "herepath-theme-change";

type ThemePreference = "system" | "light" | "dark";

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function currentPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

function choose(preference: ThemePreference) {
  try {
    if (preference === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, preference);
  } catch {
    // storage unavailable — the choice still applies until the page is reloaded
  }
  // With no data-theme attribute the page follows the phone's own light/dark setting.
  if (preference === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", preference);
  window.dispatchEvent(new Event(THEME_EVENT));
}

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "Match my phone", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export function ThemeSelector() {
  const preference = useSyncExternalStore(subscribe, currentPreference, () => "system" as ThemePreference);

  return (
    <div role="group" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-lg bg-surface p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={preference === value}
          onClick={() => choose(value)}
          className={cn(
            "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-[12px] font-medium transition-colors",
            preference === value ? "bg-green-primary text-white" : "text-text-secondary hover:text-text-primary",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
