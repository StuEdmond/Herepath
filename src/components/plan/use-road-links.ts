"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { linkKey, MIN_LINK_MILES, type RoadLink, type RoadLinkResponse } from "@/lib/road-link";
import type { LinkLeg } from "@/lib/trip-planner";

/** Wait for the rider to stop changing the trip before asking, so a quick reshuffle doesn't ask about stretches that no longer exist. */
const SETTLE_MS = 400;
/** A few at a time is quick enough, and kind to the routing service. */
const AT_ONCE = 3;

export interface RoadLinksState {
  /** Road routes found so far, by `linkKey`. */
  roadLinks: ReadonlyMap<string, RoadLink>;
  /** Stretches still being looked up. */
  pending: number;
  /** Some stretches couldn't be routed, so they stay estimates. */
  someFailed: boolean;
  /** The routing service's credit, to show beside its routes. */
  attribution: string | null;
}

/**
 * Asks `/api/route` for the road between each stretch of the trip (the ride from the start, between routes, and home) and keeps the
 * answers for the rest of the visit. A stretch that can't be routed is remembered as failed and stays an estimate.
 */
export function useRoadLinks(links: (LinkLeg | null)[]): RoadLinksState {
  const [results, setResults] = useState<Record<string, RoadLink | null>>({});
  const [attribution, setAttribution] = useState<string | null>(null);
  const asked = useRef(new Set<string>());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const wanted = useMemo(() => {
    const seen = new Map<string, LinkLeg>();
    for (const leg of links) {
      if (leg && leg.straightMiles >= MIN_LINK_MILES) seen.set(linkKey(leg.from, leg.to), leg);
    }
    return seen;
  }, [links]);

  useEffect(() => {
    const todo = [...wanted].filter(([key]) => !asked.current.has(key));
    if (todo.length === 0) return;

    const timer = setTimeout(async () => {
      const queue = todo.filter(([key]) => !asked.current.has(key));
      queue.forEach(([key]) => asked.current.add(key));

      const worker = async () => {
        for (let next = queue.shift(); next; next = queue.shift()) {
          const [key, leg] = next;
          let found: RoadLink | null = null;
          try {
            const query = new URLSearchParams({ from: `${leg.from.lat},${leg.from.lng}`, to: `${leg.to.lat},${leg.to.lng}` });
            const response = await fetch(`/api/route?${query}`);
            if (response.ok) {
              const body = (await response.json()) as RoadLinkResponse;
              found = { miles: body.miles, minutes: body.minutes, line: body.line };
              if (mounted.current) setAttribution(body.attribution);
            }
          } catch {
            // Offline or the service didn't answer: the stretch stays an estimate.
          }
          if (mounted.current) setResults((current) => ({ ...current, [key]: found }));
        }
      };
      // If the trip changes while these are being asked, the answers are still kept: the rider may put the route back.
      await Promise.all(Array.from({ length: Math.min(AT_ONCE, queue.length) }, worker));
    }, SETTLE_MS);

    return () => clearTimeout(timer);
  }, [wanted]);

  const roadLinks = useMemo(() => {
    const map = new Map<string, RoadLink>();
    for (const [key, value] of Object.entries(results)) if (value) map.set(key, value);
    return map;
  }, [results]);

  let pending = 0;
  let someFailed = false;
  for (const key of wanted.keys()) {
    if (!(key in results)) pending++;
    else if (results[key] === null) someFailed = true;
  }

  return { roadLinks, pending, someFailed, attribution };
}
