import dynamic from "next/dynamic";
import { MapSkeleton } from "@/components/map/map-skeleton";

/** Grid view is the default, so most visits never need MapLibre's ~800KB — only fetched when Map view is selected. */
export const DynamicResultsPinMap = dynamic(() => import("./results-pin-map").then((m) => m.ResultsPinMap), {
  loading: () => <MapSkeleton className="h-[60vh] w-full rounded-lg" />,
});
