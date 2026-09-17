"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { parseGpx } from "@/lib/gpx";
import { MapSkeleton } from "@/components/map/map-skeleton";
import { Field, TextInput } from "@/components/admin/form-fields";

const RouteMap = dynamic(() => import("@/components/map/route-map").then((m) => m.RouteMap), {
  ssr: false,
  loading: () => <MapSkeleton className="h-56 w-full rounded-lg" />,
});
import type { GeoPoint } from "@/db/schema/routes";

export interface GpxDefaults {
  geometry: GeoJSON.LineString | null;
  distanceMiles: string;
  startPoint: GeoPoint | null;
  endPoint: GeoPoint | null;
}

export function GpxUploadField({
  defaults,
  distanceFieldName = "distanceMiles",
  geometryFieldName = "geometry",
  includeStartEndFields = true,
}: {
  defaults?: GpxDefaults;
  /** Name of the hidden distance input — lets callers wire it to their own field (e.g. "totalDistanceMiles"). */
  distanceFieldName?: string;
  /** Name of the hidden geometry input — lets callers wire it to their own field (e.g. "ownRouteGeometry"). */
  geometryFieldName?: string;
  /** Route has separate start/end point columns; DayRide/Tour don't, so this can be turned off. */
  includeStartEndFields?: boolean;
}) {
  const [geometry, setGeometry] = useState<GeoJSON.LineString | null>(defaults?.geometry ?? null);
  const [distanceMiles, setDistanceMiles] = useState(defaults?.distanceMiles ?? "");
  const [startPoint, setStartPoint] = useState<GeoPoint | null>(defaults?.startPoint ?? null);
  const [endPoint, setEndPoint] = useState<GeoPoint | null>(defaults?.endPoint ?? null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    try {
      const text = await file.text();
      const parsed = parseGpx(text);
      setGeometry(parsed.geometry);
      setDistanceMiles(String(parsed.distanceMiles));
      setStartPoint(parsed.startPoint);
      setEndPoint(parsed.endPoint);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this GPX file.");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-surface p-3">
      <Field label="GPX file" hint="Uploading a track auto-calculates distance and draws the map below.">
        <input
          type="file"
          accept=".gpx,application/gpx+xml"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="text-[14px] text-text-secondary"
        />
      </Field>
      {error && <p className="text-[13px] text-red-accent">{error}</p>}

      <RouteMap geometry={geometry} className="h-56 w-full rounded-lg" />

      <Field label="Distance (miles)" hint="Auto-filled from the GPX; you can override it.">
        <TextInput
          name={distanceFieldName}
          value={distanceMiles}
          onChange={(e) => setDistanceMiles(e.target.value)}
          required
          inputMode="decimal"
        />
      </Field>

      <input type="hidden" name={geometryFieldName} value={geometry ? JSON.stringify(geometry) : ""} />
      {includeStartEndFields && (
        <>
          <input type="hidden" name="startLat" value={startPoint?.lat ?? ""} />
          <input type="hidden" name="startLng" value={startPoint?.lng ?? ""} />
          <input type="hidden" name="endLat" value={endPoint?.lat ?? ""} />
          <input type="hidden" name="endLng" value={endPoint?.lng ?? ""} />
        </>
      )}
    </div>
  );
}
