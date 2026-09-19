"use client";

import { Fragment, useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeftRight, ArrowUp, Crosshair, Download, LocateFixed, Save, Trash2, X } from "lucide-react";
import { saveTrip } from "@/app/plan/actions";
import { NavAppHandoff } from "@/components/route/nav-app-handoff";
import { Button } from "@/components/ui/button";
import { DIFFICULTY_LABELS } from "@/components/ui/difficulty-gauge";
import { LinkButton } from "@/components/ui/link-button";
import { BIKE_TYPE_LABELS } from "@/lib/bike-types";
import { haversineMiles, type LatLng } from "@/lib/geo";
import { slugify } from "@/lib/slug";
import { DAY_LENGTH_OPTIONS, MAX_SAVED_TRIPS, TRIP_NAME_MAX_LENGTH } from "@/lib/trip-limits";
import {
  DAY_COLORS,
  LONG_GAP_MILES,
  MAX_TRIP_ROUTES,
  exitPoint,
  formatDuration,
  formatMiles,
  splitIntoDays,
  suggestRoundTrips,
  summariseTrip,
  tripGpxHref,
  type PlannerRoute,
  type RoundTripSearch,
  type TripItem,
  type LinkLeg,
} from "@/lib/trip-planner";
import { TripMap, type TripMapStop } from "./trip-map";
import { useTripPlaces } from "./use-trip-places";

export interface InitialTrip {
  id: string | null;
  name: string;
  items: TripItem[];
  milesPerDay: number | null;
  origin: LatLng | null;
}

const SURFACE_LABEL = { good: "Good", mixed: "Mixed", poor: "Poor" } as const;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-raised px-3 py-2">
      <div className="text-[12px] text-text-muted">{label}</div>
      <div className="text-[15px] text-text-primary">{value}</div>
    </div>
  );
}

function LinkRow({ leg, label }: { leg: LinkLeg; label: string }) {
  const long = leg.straightMiles > LONG_GAP_MILES;
  return (
    <li className={`flex items-start gap-2 pl-9 text-[12px] ${long ? "text-red-tint-text" : "text-text-muted"}`}>
      <span aria-hidden="true" className="mt-1.5 h-0 w-4 shrink-0 border-t-2 border-dashed border-current" />
      <span>
        {label}: about {formatMiles(leg.miles)} (estimate){long ? ". That's a long gap. Consider adding a route in between." : ""}
      </span>
    </li>
  );
}

export function TripBuilder({
  routes,
  initial,
  addSlug,
  signedIn,
}: {
  routes: PlannerRoute[];
  initial: InitialTrip | null;
  /** A route to start the trip with, from a "plan a trip with this route" link. */
  addSlug: string | null;
  signedIn: boolean;
}) {
  const routesById = useMemo(() => new Map(routes.map((r) => [r.id, r])), [routes]);

  const [items, setItems] = useState<TripItem[]>(() => {
    if (initial) return initial.items;
    const start = addSlug ? routes.find((r) => r.slug === addSlug) : undefined;
    return start ? [{ routeId: start.id, reversed: false }] : [];
  });
  const [origin, setOrigin] = useState<LatLng | null>(initial?.origin ?? null);
  const [milesPerDay, setMilesPerDay] = useState<number | null>(initial?.milesPerDay ?? null);
  const [name, setName] = useState(initial?.name ?? "");
  const [savedId, setSavedId] = useState<string | null>(initial?.id ?? null);
  const [message, setMessage] = useState<{ text: string; good: boolean } | null>(null);
  const [saving, startSaving] = useTransition();
  const [picking, setPicking] = useState(false);
  const [fitKey, setFitKey] = useState(0);
  const [filter, setFilter] = useState("");

  const [targetMiles, setTargetMiles] = useState(120);
  const [search, setSearch] = useState<RoundTripSearch | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const trip = useMemo(() => summariseTrip(items, routesById, origin), [items, routesById, origin]);
  const days = useMemo(() => (milesPerDay && trip.stops.length > 0 ? splitIntoDays(trip, milesPerDay, origin) : null), [trip, milesPerDay, origin]);

  const dayOfStop = useMemo(() => {
    const map = new Map<number, number>();
    days?.forEach((day, dayIndex) => day.stopIndexes.forEach((stopIndex) => map.set(stopIndex, dayIndex)));
    return map;
  }, [days]);

  const mapStops: TripMapStop[] = useMemo(
    () =>
      trip.stops.map((stop, index) => ({
        routeId: stop.route.id,
        order: index + 1,
        color: DAY_COLORS[(dayOfStop.get(index) ?? 0) % DAY_COLORS.length],
        entry: stop.entry,
      })),
    [trip.stops, dayOfStop],
  );
  const legs = useMemo(() => trip.links.filter((l): l is LinkLeg => l !== null), [trip.links]);

  const stopSlugs = useMemo(() => trip.stops.map((s) => s.route.slug), [trip.stops]);
  const placesState = useTripPlaces(stopSlugs);

  // --- changing the trip ---------------------------------------------------------------------------------------------

  const toggleRoute = useCallback(
    (routeId: string) => {
      setMessage(null);
      setItems((current) => {
        if (current.some((i) => i.routeId === routeId)) return current.filter((i) => i.routeId !== routeId);
        if (current.length >= MAX_TRIP_ROUTES) return current;
        const route = routesById.get(routeId);
        if (!route) return current;
        // Ride each new route in whichever direction starts nearer to where the last one finished.
        const last = current[current.length - 1];
        const lastRoute = last ? routesById.get(last.routeId) : undefined;
        const from = lastRoute && last ? exitPoint(lastRoute, last.reversed) : null;
        const reversed = from ? haversineMiles(from, route.end) < haversineMiles(from, route.start) : false;
        return [...current, { routeId, reversed }];
      });
    },
    [routesById],
  );

  const move = (index: number, by: -1 | 1) =>
    setItems((current) => {
      const target = index + by;
      if (target < 0 || target >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });

  const flip = (index: number) => setItems((current) => current.map((item, i) => (i === index ? { ...item, reversed: !item.reversed } : item)));

  const pickOrigin = useCallback((point: LatLng) => {
    setOrigin(point);
    setPicking(false);
    setSearch(null);
  }, []);

  function locateMe() {
    setLocationError(null);
    if (!("geolocation" in navigator)) {
      setLocationError("Your browser can't share its location. Tap the map instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        pickOrigin({ lat: position.coords.latitude, lng: position.coords.longitude });
        setFitKey((k) => k + 1);
        setLocating(false);
      },
      () => {
        setLocationError("Couldn't get your location. Tap the map to set a start point instead.");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }

  function runSearch() {
    if (origin) setSearch(suggestRoundTrips(routes, origin, targetMiles));
  }

  function applyOption(option: { items: TripItem[] }) {
    setItems(option.items);
    setMessage(null);
    setFitKey((k) => k + 1);
  }

  function save() {
    setMessage(null);
    startSaving(async () => {
      const result = await saveTrip({ id: savedId ?? undefined, name, items, milesPerDay, origin });
      if (result.ok) {
        setSavedId(result.id);
        setMessage({ text: "Saved to your profile.", good: true });
      } else {
        setMessage({ text: result.error, good: false });
      }
    });
  }

  // --- what to show ------------------------------------------------------------------------------------------------

  const inTrip = new Set(items.map((i) => i.routeId));
  const visibleRoutes = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const matching = routes.filter((r) => !q || `${r.name} ${r.regionName} ${r.startLabel ?? ""} ${r.endLabel ?? ""}`.toLowerCase().includes(q));
    // Nearest to the start point first when there is one.
    return origin ? [...matching].sort((a, b) => Math.min(haversineMiles(origin, a.start), haversineMiles(origin, a.end)) - Math.min(haversineMiles(origin, b.start), haversineMiles(origin, b.end))) : matching;
  }, [routes, filter, origin]);

  const tripName = name.trim() || "My trip";
  const wholeHref = tripGpxHref(tripName, trip.stops.map((s) => ({ slug: s.route.slug, reversed: s.item.reversed })), origin);
  const downloadName = `${slugify(tripName) || "herepath-trip"}.gpx`;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start">
      <div className="min-w-0 lg:sticky lg:top-20">
        <TripMap
          routes={routes}
          stops={mapStops}
          legs={legs}
          origin={origin}
          picking={picking}
          fitKey={fitKey}
          placesState={placesState}
          onToggleRoute={toggleRoute}
          onPickOrigin={pickOrigin}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        {/* Your trip */}
        <section className="flex flex-col gap-3 rounded-xl bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[18px] text-text-primary">Your trip</h2>
            {items.length > 0 && (
              <div className="flex gap-1.5">
                <button type="button" className="min-h-9 rounded-lg px-2 text-[13px] text-text-secondary hover:text-text-primary" onClick={() => setFitKey((k) => k + 1)}>
                  Zoom to trip
                </button>
                <button
                  type="button"
                  className="min-h-9 rounded-lg px-2 text-[13px] text-text-secondary hover:text-text-primary"
                  onClick={() => {
                    setItems([]);
                    setMessage(null);
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {trip.stops.length === 0 ? (
            <p className="text-[14px] text-text-muted">
              Click routes on the map, or add them from the list below, to build your trip. Or set a start point and ask for round trip suggestions.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Stat label={origin ? "Round trip distance" : "Total distance"} value={formatMiles(trip.totalMiles)} />
                <Stat label="Riding time" value={formatDuration(trip.totalMinutes)} />
                <Stat label="Hardest section" value={`${trip.hardestDifficulty} of 5 · ${DIFFICULTY_LABELS[trip.hardestDifficulty - 1]}`} />
                <Stat label="Road surface" value={trip.worstSurface ? SURFACE_LABEL[trip.worstSurface] : "—"} />
              </div>
              <p className="text-[12px] text-text-muted">
                {formatMiles(trip.routeMiles)} on {trip.stops.length} {trip.stops.length === 1 ? "route" : "routes"}
                {trip.linkMiles > 0 ? `, plus about ${formatMiles(trip.linkMiles)} joining them (an estimate: we join routes with straight lines, not roads)` : ""}.
              </p>
              <p className="text-[13px] text-text-secondary">
                <span className="text-text-muted">Suits: </span>
                {trip.suitedForAll.length > 0 ? trip.suitedForAll.map((t) => BIKE_TYPE_LABELS[t] ?? t).join(", ") : "no bike type is rated as suited on every route"}
              </p>
              {trip.missing > 0 && <p className="text-[13px] text-red-accent">{trip.missing} route(s) in this trip are no longer available and have been left out.</p>}
              {trip.longGaps > 0 && (
                <p className="text-[13px] text-red-tint-text">
                  {trip.longGaps} gap(s) between routes are over {LONG_GAP_MILES} miles. The dashed lines show them.
                </p>
              )}

              <ol className="flex flex-col gap-1.5">
                {trip.stops.map((stop, index) => {
                  const before = trip.links[index];
                  return (
                    <Fragment key={stop.route.id}>
                      {before && <LinkRow leg={before} label={index === 0 ? "From your start" : "Between these routes"} />}
                      <li className="flex items-center gap-2 rounded-lg bg-surface-raised p-2">
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-[#0e0f12]"
                          style={{ backgroundColor: DAY_COLORS[(dayOfStop.get(index) ?? 0) % DAY_COLORS.length] }}
                          aria-hidden="true"
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <Link href={`/routes/${stop.route.slug}`} target="_blank" className="block truncate text-[14px] text-text-primary hover:underline">
                            {stop.route.name}
                          </Link>
                          <span className="block truncate text-[12px] text-text-muted">
                            {stop.route.distanceMiles} mi · {stop.entryLabel ?? "start"} → {stop.exitLabel ?? "finish"}
                            {stop.item.reversed ? " (reversed)" : ""}
                          </span>
                        </div>
                        <div className="flex shrink-0">
                          <button type="button" aria-label={`Move ${stop.route.name} up`} disabled={index === 0} onClick={() => move(index, -1)} className="flex h-9 w-8 items-center justify-center rounded text-text-secondary hover:text-text-primary disabled:opacity-30">
                            <ArrowUp className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button type="button" aria-label={`Move ${stop.route.name} down`} disabled={index === trip.stops.length - 1} onClick={() => move(index, 1)} className="flex h-9 w-8 items-center justify-center rounded text-text-secondary hover:text-text-primary disabled:opacity-30">
                            <ArrowDown className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button type="button" aria-label={`Ride ${stop.route.name} the other way`} title="Ride it the other way" onClick={() => flip(index)} className="flex h-9 w-8 items-center justify-center rounded text-text-secondary hover:text-text-primary">
                            <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button type="button" aria-label={`Remove ${stop.route.name}`} onClick={() => toggleRoute(stop.route.id)} className="flex h-9 w-8 items-center justify-center rounded text-text-secondary hover:text-red-accent">
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    </Fragment>
                  );
                })}
                {trip.links[trip.stops.length] && <LinkRow leg={trip.links[trip.stops.length]!} label="Ride home" />}
              </ol>

              {/* Days */}
              <div className="flex flex-col gap-2 border-t border-surface-raised pt-3">
                <label className="flex flex-wrap items-center gap-2 text-[14px] text-text-primary">
                  Split into days
                  <select
                    value={milesPerDay ?? ""}
                    onChange={(e) => setMilesPerDay(e.target.value ? Number(e.target.value) : null)}
                    className="min-h-9 rounded-lg border border-text-muted/40 bg-surface px-2 text-[14px] text-text-primary"
                  >
                    <option value="">One day</option>
                    {DAY_LENGTH_OPTIONS.map((miles) => (
                      <option key={miles} value={miles}>
                        About {miles} miles a day
                      </option>
                    ))}
                  </select>
                </label>
                {days && (
                  <ul className="flex flex-col gap-1.5">
                    {days.map((day) => (
                      <li key={day.number} className="rounded-lg bg-surface-raised p-2 text-[13px]">
                        <div className="flex items-center gap-2 text-[14px] text-text-primary">
                          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: DAY_COLORS[(day.number - 1) % DAY_COLORS.length] }} aria-hidden="true" />
                          Day {day.number} · {formatMiles(day.miles)} · {formatDuration(day.minutes)}
                        </div>
                        <div className="text-text-secondary">{day.stopIndexes.map((i) => trip.stops[i].route.name).join(", ")}</div>
                        <div className="text-text-muted">
                          Ends {day.endsAtLabel ? `near ${day.endsAtLabel}` : "at the finish of the last route"}
                          {day.overLimit ? ". This day runs over your limit because of a long route, or a long stretch to reach it." : ""}
                        </div>
                        <a
                          href={tripGpxHref(`${tripName} - Day ${day.number}`, day.stopIndexes.map((i) => ({ slug: trip.stops[i].route.slug, reversed: trip.stops[i].item.reversed })), day.number === 1 ? origin : null)}
                          className="mt-1 inline-flex items-center gap-1 text-green-bright underline hover:no-underline"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          GPX for day {day.number}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {days && <p className="text-[12px] text-text-muted">Routes aren&apos;t cut, so a day ends when the next route wouldn&apos;t fit. Turn on Stay on the map to see places to sleep along the way.</p>}
              </div>

              {/* Save and take it with you */}
              <div className="flex flex-col gap-2 border-t border-surface-raised pt-3">
                <label className="flex flex-col gap-1 text-[13px] text-text-muted">
                  Trip name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={TRIP_NAME_MAX_LENGTH}
                    placeholder="e.g. Peak District weekend"
                    className="min-h-11 rounded-lg border border-text-muted/40 bg-surface px-3 text-[15px] text-text-primary"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {signedIn ? (
                    <Button type="button" variant="primary" className="min-h-10 px-4 text-[14px]" onClick={save} disabled={saving || !name.trim()}>
                      <Save className="h-4 w-4" aria-hidden="true" />
                      {saving ? "Saving…" : savedId ? "Save changes" : "Save trip"}
                    </Button>
                  ) : (
                    <LinkButton href="/account/sign-in" variant="primary" className="min-h-10 px-4 text-[14px]">
                      Sign in to save this trip
                    </LinkButton>
                  )}
                  <LinkButton href={wholeHref} variant="secondary" className="min-h-10 px-4 text-[14px]">
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download GPX
                  </LinkButton>
                </div>
                {message && (
                  <p className={`text-[13px] ${message.good ? "text-green-bright" : "text-red-accent"}`} role="status">
                    {message.text}
                    {message.good && (
                      <>
                        {" "}
                        <Link href="/profile" className="underline">
                          See your trips
                        </Link>
                      </>
                    )}
                  </p>
                )}
                {signedIn && !savedId && <p className="text-[12px] text-text-muted">You can save up to {MAX_SAVED_TRIPS} trips. They&apos;re private to you.</p>}
                <NavAppHandoff
                  gpxHref={wholeHref}
                  filename={downloadName}
                  rideName={tripName}
                  note="This file has one track per route, in order. Your navigation app finds its own way between the routes, so plan those stretches in the app."
                />
              </div>
            </>
          )}
        </section>

        {/* Round trip */}
        <section className="flex flex-col gap-3 rounded-xl bg-surface p-3">
          <div>
            <h2 className="text-[18px] text-text-primary">Round trip from where you start</h2>
            <p className="mt-0.5 text-[13px] text-text-muted">Set a start point and a length, and we&apos;ll suggest loops built from our routes that finish back where you began.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant={picking ? "primary" : "secondary"} className="min-h-10 px-3 text-[14px]" onClick={() => setPicking((p) => !p)}>
              <Crosshair className="h-4 w-4" aria-hidden="true" />
              {picking ? "Tap the map…" : origin ? "Move start point" : "Choose on the map"}
            </Button>
            <Button type="button" variant="secondary" className="min-h-10 px-3 text-[14px]" onClick={locateMe} disabled={locating}>
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
              {locating ? "Finding you…" : "Use my location"}
            </Button>
            {origin && (
              <button
                type="button"
                className="inline-flex min-h-10 items-center gap-1 px-2 text-[13px] text-text-secondary hover:text-text-primary"
                onClick={() => {
                  setOrigin(null);
                  setSearch(null);
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Clear start
              </button>
            )}
          </div>
          {locationError && <p className="text-[13px] text-red-accent">{locationError}</p>}
          <p className="text-[12px] text-text-muted">
            {origin ? "Start point set. It's used only in your browser and saved only if you save the trip." : "No start point yet."}
          </p>

          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-[13px] text-text-muted">
              About how many miles?
              <input
                type="number"
                min={30}
                max={400}
                step={10}
                value={targetMiles}
                onChange={(e) => setTargetMiles(Number(e.target.value))}
                className="min-h-10 w-28 rounded-lg border border-text-muted/40 bg-surface px-3 text-[15px] text-text-primary"
              />
            </label>
            <Button type="button" variant="primary" className="min-h-10 px-4 text-[14px]" onClick={runSearch} disabled={!origin || !(targetMiles >= 30)}>
              Suggest round trips
            </Button>
          </div>

          {search && (
            <div className="flex flex-col gap-2" role="status">
              {search.options.length === 0 ? (
                <p className="text-[13px] text-text-secondary">
                  We couldn&apos;t find a loop of about {targetMiles} miles from there.
                  {search.nearestRouteMiles !== null && search.nearestRouteMiles > 15
                    ? ` The nearest route is about ${Math.round(search.nearestRouteMiles)} miles from your start point, and we don't have enough routes around it yet.`
                    : " Try a different length or start point."}{" "}
                  We&apos;re adding more routes all the time.
                </p>
              ) : (
                search.options.map((option, index) => (
                  <div key={option.items.map((i) => i.routeId).join("|")} className="rounded-lg bg-surface-raised p-2 text-[13px]">
                    <div className="text-[14px] text-text-primary">
                      Option {index + 1} · {formatMiles(option.totalMiles)} · {option.routeCount} {option.routeCount === 1 ? "route" : "routes"}
                    </div>
                    <div className="text-text-secondary">{option.items.map((i) => routesById.get(i.routeId)?.name).join(" → ")}</div>
                    <div className="text-text-muted">About {formatMiles(option.linkMiles)} of that is joining the routes up (an estimate).</div>
                    <Button type="button" variant="secondary" className="mt-1.5 min-h-9 px-3 text-[13px]" onClick={() => applyOption(option)}>
                      Use this trip
                    </Button>
                  </div>
                ))
              )}
              {search.cutShort && search.options.length > 0 && <p className="text-[12px] text-text-muted">There are a lot of routes near you, so these are the best of the ones we looked at first.</p>}
            </div>
          )}
        </section>

        {/* All routes */}
        <section className="flex flex-col gap-2 rounded-xl bg-surface p-3">
          <h2 className="text-[18px] text-text-primary">Add routes</h2>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by name, place or region"
            aria-label="Search routes"
            className="min-h-10 rounded-lg border border-text-muted/40 bg-surface px-3 text-[14px] text-text-primary"
          />
          <p className="text-[12px] text-text-muted">{origin ? "Nearest to your start point first. " : ""}{visibleRoutes.length} of {routes.length} routes.</p>
          <ul className="flex max-h-[28rem] flex-col gap-1.5 overflow-y-auto pr-1">
            {visibleRoutes.map((route) => {
              const added = inTrip.has(route.id);
              return (
                <li key={route.id} className="flex items-center gap-2 rounded-lg bg-surface-raised p-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] text-text-primary">{route.name}</div>
                    <div className="truncate text-[12px] text-text-muted">
                      {route.regionName} · {route.distanceMiles} mi · difficulty {route.difficulty} of 5 · {route.startLabel ?? "start"} → {route.endLabel ?? "finish"}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={added ? "secondary" : "primary"}
                    className="min-h-9 shrink-0 px-3 text-[13px]"
                    onClick={() => toggleRoute(route.id)}
                    disabled={!added && items.length >= MAX_TRIP_ROUTES}
                    aria-label={`${added ? "Remove" : "Add"} ${route.name}`}
                  >
                    {added ? "Remove" : "Add"}
                  </Button>
                </li>
              );
            })}
            {visibleRoutes.length === 0 && <li className="text-[13px] text-text-muted">No routes match that search.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
