"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PLACES_ENDPOINT, PLACE_KINDS, type AlongPlace, type PlaceKind, type PlacesSource } from "@/lib/place-kinds";

interface LoadedKind {
  places: AlongPlace[];
  /** False when OpenStreetMap couldn't be reached in time, so the list may be missing places. */
  complete: boolean;
}

export interface PlacesState {
  active: ReadonlySet<PlaceKind>;
  loading: ReadonlySet<PlaceKind>;
  failed: ReadonlySet<PlaceKind>;
  loaded: Partial<Record<PlaceKind, LoadedKind>>;
  /** Everything to draw: the places of every kind that is switched on. */
  places: AlongPlace[];
  toggle: (kind: PlaceKind) => void;
  retry: (kind: PlaceKind) => void;
}

function withKind<T>(set: ReadonlySet<T>, kind: T, present: boolean): Set<T> {
  const next = new Set(set);
  if (present) next.add(kind);
  else next.delete(kind);
  return next;
}

/** Which kinds of place are switched on for a ride's map, and the places fetched for them (fetched the first time each is switched on). */
export function usePlaces(source: PlacesSource | undefined): PlacesState {
  const [active, setActive] = useState<ReadonlySet<PlaceKind>>(new Set());
  const [loading, setLoading] = useState<ReadonlySet<PlaceKind>>(new Set());
  const [failed, setFailed] = useState<ReadonlySet<PlaceKind>>(new Set());
  const [loaded, setLoaded] = useState<Partial<Record<PlaceKind, LoadedKind>>>({});
  const requestedRef = useRef(new Set<PlaceKind>());
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current = new AbortController();
    return () => abortRef.current?.abort();
  }, []);

  const load = useCallback(
    async (kind: PlaceKind) => {
      if (!source) return;
      requestedRef.current.add(kind);
      setLoading((s) => withKind(s, kind, true));
      setFailed((s) => withKind(s, kind, false));
      try {
        const query = new URLSearchParams({ type: source.type, slug: source.slug, kind });
        // A long tour can run out of time before every day has been looked up. Each finished day is kept, so a
        // second request only has the missing days left, and one automatic retry usually completes the list.
        for (let attempt = 0; attempt < 2; attempt++) {
          const response = await fetch(`${PLACES_ENDPOINT}?${query}`, { signal: abortRef.current?.signal });
          if (!response.ok) throw new Error(`Places request failed (${response.status})`);
          const body = (await response.json()) as { places: AlongPlace[]; osmOk: boolean };
          setLoaded((l) => ({ ...l, [kind]: { places: body.places, complete: body.osmOk } }));
          if (body.osmOk) break;
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        requestedRef.current.delete(kind);
        setFailed((s) => withKind(s, kind, true));
      } finally {
        setLoading((s) => withKind(s, kind, false));
      }
    },
    [source],
  );

  const toggle = useCallback(
    (kind: PlaceKind) => {
      const turningOn = !active.has(kind);
      setActive((s) => withKind(s, kind, turningOn));
      if (turningOn && !requestedRef.current.has(kind)) void load(kind);
    },
    [active, load],
  );

  const places = useMemo(() => PLACE_KINDS.filter((k) => active.has(k.id)).flatMap((k) => loaded[k.id]?.places ?? []), [active, loaded]);

  return { active, loading, failed, loaded, places, toggle, retry: (kind) => void load(kind) };
}
