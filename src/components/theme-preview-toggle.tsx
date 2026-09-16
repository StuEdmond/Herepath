"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ThemeOverride = "system" | "light" | "dark";

export function ThemePreviewToggle() {
  const [theme, setTheme] = useState<ThemeOverride>("system");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[13px] text-text-muted">Preview theme:</span>
      {(["system", "light", "dark"] as const).map((option) => (
        <Button
          key={option}
          type="button"
          variant={theme === option ? "primary" : "secondary"}
          className="min-h-9 px-3 text-[13px] capitalize"
          onClick={() => setTheme(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}
