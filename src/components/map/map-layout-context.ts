"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

const LAYOUT_KEY = "herepath:map-layout";
const LAYOUT_EVENT = "herepath-map-layout-change";

/** True inside the larger-map layout of a ride page, so the map can grow to fill the space it's given. */
export const MapExpandedContext = createContext(false);

export function useMapExpanded(): boolean {
  return useContext(MapExpandedContext);
}

function subscribe(onChange: () => void) {
  window.addEventListener(LAYOUT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(LAYOUT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readExpanded(): boolean {
  try {
    return localStorage.getItem(LAYOUT_KEY) === "expanded";
  } catch {
    return false;
  }
}

/** Whether this rider chose the larger-map layout (kept on their device). */
export function useMapLayoutExpanded(): boolean {
  return useSyncExternalStore(subscribe, readExpanded, () => false);
}

export function setMapLayoutExpanded(expanded: boolean) {
  try {
    if (expanded) localStorage.setItem(LAYOUT_KEY, "expanded");
    else localStorage.removeItem(LAYOUT_KEY);
  } catch {
    // storage unavailable — the choice lasts until the page is reloaded
  }
  window.dispatchEvent(new Event(LAYOUT_EVENT));
}
