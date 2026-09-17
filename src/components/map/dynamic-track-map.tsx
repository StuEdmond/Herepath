import dynamic from "next/dynamic";
import { MapSkeleton } from "./map-skeleton";

/** See dynamic-route-map.tsx for why this is code-split rather than imported directly. */
export const DynamicTrackMap = dynamic(() => import("./track-map").then((m) => m.TrackMap), {
  loading: () => <MapSkeleton />,
});
