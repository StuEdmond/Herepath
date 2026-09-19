"use client";

import { useEffect } from "react";
import { isNativeApp } from "@/lib/native";

/**
 * In the mobile app, keeps the phone's status bar and bottom gesture bar icons readable against the
 * page: light icons on the dark theme, dark icons on the light one. It follows the rider's Light/Dark
 * choice from Settings, or the phone's own setting when they haven't made one. Does nothing on the web.
 */
export function NativeSystemBars() {
  useEffect(() => {
    if (!isNativeApp()) return;

    const root = document.documentElement;
    const phoneDark = window.matchMedia("(prefers-color-scheme: dark)");
    let cancelled = false;

    async function apply() {
      const forced = root.getAttribute("data-theme");
      const dark = forced ? forced === "dark" : phoneDark.matches;
      try {
        const { SystemBars, SystemBarsStyle } = await import("@capacitor/core");
        if (!cancelled) await SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light });
      } catch {
        // an older app build without the system bars plugin — the bars keep the phone's default look
      }
    }

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    phoneDark.addEventListener("change", apply);

    return () => {
      cancelled = true;
      observer.disconnect();
      phoneDark.removeEventListener("change", apply);
    };
  }, []);

  return null;
}
