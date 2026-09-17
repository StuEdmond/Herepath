import dynamic from "next/dynamic";
import { MapSkeleton } from "./map-skeleton";

/**
 * Code-splits MapLibre GL (~800KB) into its own chunk instead of the main
 * page bundle — important for the brief's "fast on poor rural mobile signal"
 * requirement (Section 2/8). No ssr:false here since this is imported from
 * Server Components too; RouteMap itself is a "use client" leaf that only
 * touches the DOM/window inside useEffect, so plain SSR of the empty
 * container is harmless.
 */
export const DynamicRouteMap = dynamic(() => import("./route-map").then((m) => m.RouteMap), {
  loading: () => <MapSkeleton />,
});
