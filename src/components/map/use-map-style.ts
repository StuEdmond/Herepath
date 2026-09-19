"use client";

import { useEffect, useRef, useSyncExternalStore, type MutableRefObject } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";
import { mapStyleUrl, type MapStyleId } from "@/lib/map-styles";

const STYLE_KEY = "herepath:map-style";
const STYLE_EVENT = "herepath-map-style-change";

function subscribe(onChange: () => void) {
  window.addEventListener(STYLE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(STYLE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The map type this rider last chose (kept on their device), or "streets". */
export function readMapStyle(): MapStyleId {
  try {
    const saved = localStorage.getItem(STYLE_KEY);
    return saved === "outdoor" || saved === "satellite" ? saved : "streets";
  } catch {
    return "streets";
  }
}

export function setMapStyle(id: MapStyleId) {
  try {
    if (id === "streets") localStorage.removeItem(STYLE_KEY);
    else localStorage.setItem(STYLE_KEY, id);
  } catch {
    // storage unavailable — the choice lasts until the page is reloaded
  }
  window.dispatchEvent(new Event(STYLE_EVENT));
}

export function useMapStyle(): MapStyleId {
  return useSyncExternalStore(subscribe, readMapStyle, () => "streets" as MapStyleId);
}

/**
 * Keeps a map on the rider's chosen map type. Swapping a style wipes everything drawn on top of the
 * map, so onReloaded is called once the new style is ready, to draw it again. If the new style can't
 * be loaded, the map goes back to the standard one rather than staying blank.
 */
export function useApplyMapStyle(map: MaplibreMap | null, appliedRef: MutableRefObject<MapStyleId>, onReloaded?: () => void) {
  const styleId = useMapStyle();
  const reloadedRef = useRef(onReloaded);
  useEffect(() => {
    reloadedRef.current = onReloaded;
  });

  useEffect(() => {
    if (!map || styleId === appliedRef.current) return;
    const url = mapStyleUrl(styleId);
    if (!url) return;

    appliedRef.current = styleId;
    map.setStyle(url, { diff: false });

    const onLoaded = () => {
      map.off("error", onError);
      reloadedRef.current?.();
    };
    const onError = () => {
      if (styleId === "streets") return;
      map.off("style.load", onLoaded);
      map.off("error", onError);
      setMapStyle("streets");
    };
    map.once("style.load", onLoaded);
    map.on("error", onError);

    return () => {
      map.off("style.load", onLoaded);
      map.off("error", onError);
    };
  }, [map, styleId, appliedRef]);
}
