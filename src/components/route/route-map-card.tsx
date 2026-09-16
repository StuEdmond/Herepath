import { Download, Map as MapIcon, Navigation } from "lucide-react";
import { RouteMap } from "@/components/map/route-map";
import { LinkButton } from "@/components/ui/link-button";
import { buildGoogleMapsUrl, buildAppleMapsUrl } from "@/lib/map-links";

export function RouteMapCard({ slug, geometry }: { slug: string; geometry: GeoJSON.LineString }) {
  const googleUrl = buildGoogleMapsUrl(geometry);
  const appleUrl = buildAppleMapsUrl(geometry);

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface p-3">
      <RouteMap geometry={geometry} className="h-64 w-full rounded-lg sm:h-80" />
      <div className="flex flex-wrap gap-2">
        <LinkButton href={`/routes/${slug}/gpx`} variant="primary" className="min-h-10 px-4 text-[14px]">
          <Download className="h-4 w-4" aria-hidden="true" />
          Download GPX
        </LinkButton>
        <LinkButton
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          className="min-h-10 px-4 text-[14px]"
        >
          <MapIcon className="h-4 w-4" aria-hidden="true" />
          Open in Google Maps
        </LinkButton>
        <LinkButton
          href={appleUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          className="min-h-10 px-4 text-[14px]"
        >
          <Navigation className="h-4 w-4" aria-hidden="true" />
          Open in Apple Maps
        </LinkButton>
      </div>
      <p className="text-[13px] text-text-muted">
        Map apps may reroute slightly to follow their own road preferences — the GPX file follows the exact route.
      </p>
    </div>
  );
}
