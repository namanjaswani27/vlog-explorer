"use client";

import { useState, useEffect, useMemo } from "react";

const TYPE_ICONS = {
  temple: "🛕", cafe: "☕", park: "🌳", market: "🏪",
  monument: "🏛️", museum: "🎨", nature: "🌿", viewpoint: "🌄",
  street: "🚶", beach: "🏖️", lake: "🌊", other: "📍",
};

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateTravel(km) {
  if (km < 1) return { time: "~5 min walk", mode: "walk" };
  if (km < 3) return { time: `~${Math.round(km * 12)} min walk`, mode: "walk" };
  if (km < 8) return { time: `~${Math.round(km * 3 + 5)} min drive`, mode: "drive" };
  return { time: `~${Math.round(km * 2 + 10)} min drive`, mode: "drive" };
}

function nearestNeighborOrder(places) {
  if (places.length <= 1) return places;

  const valid = places.filter((p) => p.lat && p.lng);
  const noCoords = places.filter((p) => !p.lat || !p.lng);

  if (valid.length <= 1) return [...valid, ...noCoords];

  const visited = [valid[0]];
  const remaining = valid.slice(1);

  while (remaining.length > 0) {
    const last = visited[visited.length - 1];
    let nearest = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(last.lat, last.lng, remaining[i].lat, remaining[i].lng);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    }

    visited.push(remaining.splice(nearest, 1)[0]);
  }

  return [...visited, ...noCoords];
}

function groupIntoDays(orderedPlaces, maxPerDay = 4) {
  const days = [];
  for (let i = 0; i < orderedPlaces.length; i += maxPerDay) {
    days.push(orderedPlaces.slice(i, i + maxPerDay));
  }
  return days;
}

function DayCard({ dayNum, places, totalDays }) {
  const legs = [];
  let totalKm = 0;

  for (let i = 0; i < places.length - 1; i++) {
    const a = places[i];
    const b = places[i + 1];
    if (a.lat && a.lng && b.lat && b.lng) {
      const km = haversineKm(a.lat, a.lng, b.lat, b.lng);
      totalKm += km;
      legs.push({ from: i, to: i + 1, km, ...estimateTravel(km) });
    }
  }

  return (
    <div className="mb-8 last:mb-0">
      <div className="flex items-center gap-3 mb-4">
        <span className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
          {dayNum}
        </span>
        <div>
          <h3 className="text-base font-semibold text-white">Day {dayNum}</h3>
          <p className="text-xs text-gray-500">
            {places.length} stop{places.length !== 1 ? "s" : ""}
            {totalKm > 0 && ` · ~${totalKm.toFixed(1)} km total`}
          </p>
        </div>
      </div>

      <div className="ml-5 border-l border-white/8 pl-5 space-y-0">
        {places.map((place, i) => {
          const icon = TYPE_ICONS[place.type] || TYPE_ICONS.other;
          const leg = legs.find((l) => l.from === i);

          return (
            <div key={place.name + i}>
              {/* Place stop */}
              <div className="relative pb-1">
                <div className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500 border-2 border-surface-light" />
                <div className="flex items-start gap-2.5">
                  <span className="text-lg mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-medium text-white truncate">{place.name}</h4>
                      {place.name && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-400/70 hover:text-blue-300 transition-colors shrink-0"
                        >
                          Maps
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{place.best_time || place.type}</p>
                  </div>
                </div>
              </div>

              {/* Travel leg */}
              {leg && (
                <div className="relative py-2.5 ml-7">
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <span>{leg.mode === "walk" ? "🚶" : "🚗"}</span>
                    <span>{leg.time}</span>
                    <span className="text-gray-600">({leg.km.toFixed(1)} km)</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ItineraryModal({ places, onClose }) {
  const [maxPerDay, setMaxPerDay] = useState(4);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const optimized = useMemo(() => nearestNeighborOrder([...places]), [places]);
  const days = useMemo(() => groupIntoDays(optimized, maxPerDay), [optimized, maxPerDay]);

  const totalKm = useMemo(() => {
    let km = 0;
    for (let i = 0; i < optimized.length - 1; i++) {
      const a = optimized[i];
      const b = optimized[i + 1];
      if (a.lat && a.lng && b.lat && b.lng) {
        km += haversineKm(a.lat, a.lng, b.lat, b.lng);
      }
    }
    return km;
  }, [optimized]);

  const mapsRouteUrl = useMemo(() => {
    const valid = optimized.filter((p) => p.name);
    if (valid.length < 2) return null;
    const origin = encodeURIComponent(valid[0].name);
    const dest = encodeURIComponent(valid[valid.length - 1].name);
    const waypoints = valid
      .slice(1, -1)
      .map((p) => encodeURIComponent(p.name))
      .join("|");
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
    if (waypoints) url += `&waypoints=${waypoints}`;
    return url;
  }, [optimized]);

  return (
    <div className="fixed inset-0 z-50 modal-backdrop flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="relative w-full md:max-w-lg md:max-h-[88vh] max-h-[92vh] bg-surface-light md:rounded-3xl rounded-t-3xl overflow-hidden modal-slide-up flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-lg">🗺️</span> Smart Itinerary
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {optimized.length} places · {days.length} day{days.length !== 1 ? "s" : ""} · ~{totalKm.toFixed(1)} km
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-gray-500">Stops per day:</span>
            <div className="flex gap-1">
              {[3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setMaxPerDay(n)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    maxPerDay === n
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "bg-white/5 text-gray-500 border border-transparent hover:text-gray-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {mapsRouteUrl && (
              <a
                href={mapsRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 transition-colors border border-blue-500/15"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Full route
              </a>
            )}
          </div>
        </div>

        {/* Day list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-5">
          {days.map((dayPlaces, i) => (
            <DayCard key={i} dayNum={i + 1} places={dayPlaces} totalDays={days.length} />
          ))}
        </div>
      </div>
    </div>
  );
}
