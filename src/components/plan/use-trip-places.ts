"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PLACES_ENDPOINT, PLACE_KINDS, type AlongPlace, type PlaceKind } from "@/lib/place-kinds";
import type { PlacesState } from "@/components/map/use-places";

interface Answer {
  places: AlongPlace[];
  complete: boolean;
}

/**
 * Fuel, food and stay pins for every route in a trip. Each route's places are looked up separately (the same lookups the ride
 * pages use, so most come straight from the saved answers) and one at a time, so a trip of many routes doesn't flood the
 * free OpenStreetMap service. Routes added later are looked up too while a kind of place is switched on.
 */
export function useTripPlaces(slugs: string[]): PlacesState {
  const [active, setActive] = useState<ReadonlySet<PlaceKind>>(new Set());
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [failedKeys, setFailedKeys] = useState<ReadonlySet<string>>(new Set());
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(new Set());

  const slugsRef = useRef(slugs);
  const activeRef = useRef(active);
  const requestedRef = useRef(new Set<string>());
  const runningRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const key = (kind: PlaceKind, slug: string) => `${kind}:${slug}`;

  const pump = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      // Keep going until nothing that's switched on is left to look up.
      for (;;) {
        const next = PLACE_KINDS.filter((k) => activeRef.current.has(k.id))
          .flatMap((k) => slugsRef.current.map((slug) => ({ kind: k.id, slug })))
          .find((job) => !requestedRef.current.has(key(job.kind, job.slug)));
        if (!next) break;

        const k = key(next.kind, next.slug);
        requestedRef.current.add(k);
        setPendingKeys((s) => new Set(s).add(k));
        try {
          const query = new URLSearchParams({ type: "route", slug: next.slug, kind: next.kind });
          const response = await fetch(`${PLACES_ENDPOINT}?${query}`, { signal: abortRef.current?.signal });
          if (!response.ok) throw new Error(String(response.status));
          const body = (await response.json()) as { places: AlongPlace[]; osmOk: boolean };
          setAnswers((a) => ({ ...a, [k]: { places: body.places, complete: body.osmOk } }));
          setFailedKeys((s) => {
            const copy = new Set(s);
            copy.delete(k);
            return copy;
          });
        } catch (error) {
          if ((error as Error).name === "AbortError") return;
          // The key stays in requestedRef so a failed lookup isn't retried in a tight loop; "Try again" clears it.
          setFailedKeys((s) => new Set(s).add(k));
        } finally {
          setPendingKeys((s) => {
            const copy = new Set(s);
            copy.delete(k);
            return copy;
          });
        }
      }
    } finally {
      runningRef.current = false;
    }
  }, []);

  useEffect(() => {
    abortRef.current = new AbortController();
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    slugsRef.current = slugs;
    activeRef.current = active;
    void pump();
  }, [slugs, active, pump]);

  const toggle = useCallback((kind: PlaceKind) => {
    setActive((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }, []);

  const retry = useCallback(
    (kind: PlaceKind) => {
      for (const slug of slugsRef.current) {
        const k = key(kind, slug);
        // Forget failed or incomplete answers so they're looked up again.
        if (failedKeys.has(k) || answers[k]?.complete === false) requestedRef.current.delete(k);
      }
      setFailedKeys((s) => new Set([...s].filter((k) => !k.startsWith(`${kind}:`))));
      void pump();
    },
    [answers, failedKeys, pump],
  );

  return useMemo<PlacesState>(() => {
    const loading = new Set<PlaceKind>();
    const failed = new Set<PlaceKind>();
    const loaded: PlacesState["loaded"] = {};
    for (const kind of PLACE_KINDS) {
      const keys = slugs.map((slug) => key(kind.id, slug));
      if (keys.some((k) => pendingKeys.has(k))) loading.add(kind.id);
      if (keys.some((k) => failedKeys.has(k))) failed.add(kind.id);
      const have = keys.filter((k) => answers[k]);
      if (have.length > 0) {
        const merged = new Map<string, AlongPlace>();
        for (const k of have) for (const place of answers[k].places) merged.set(place.id, place);
        loaded[kind.id] = { places: [...merged.values()], complete: have.length === keys.length && have.every((k) => answers[k].complete) };
      }
    }
    const places = PLACE_KINDS.filter((k) => active.has(k.id)).flatMap((k) => loaded[k.id]?.places ?? []);
    return { active, loading, failed, loaded, places, toggle, retry };
  }, [slugs, active, answers, pendingKeys, failedKeys, toggle, retry]);
}
