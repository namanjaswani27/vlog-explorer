"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const TYPE_ICONS = {
  temple: "🛕", cafe: "☕", park: "🌳", market: "🏪",
  monument: "🏛️", museum: "🎨", nature: "🌿", viewpoint: "🌄",
  street: "🚶", beach: "🏖️", lake: "🌊", other: "📍",
};

function createEmojiIcon(type) {
  const emoji = TYPE_ICONS[type] || TYPE_ICONS.other;
  return L.divIcon({
    className: "custom-marker",
    html: `<div class="marker-pin">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -42],
  });
}

export default function MapView({ places, onPlaceClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const validPlaces = places.filter((p) => p.lat && p.lng);
    if (validPlaces.length === 0) return;

    const center = [
      validPlaces.reduce((s, p) => s + p.lat, 0) / validPlaces.length,
      validPlaces.reduce((s, p) => s + p.lng, 0) / validPlaces.length,
    ];

    const map = L.map(mapRef.current, {
      center,
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }
    ).addTo(map);

    const bounds = L.latLngBounds();

    validPlaces.forEach((place) => {
      const marker = L.marker([place.lat, place.lng], {
        icon: createEmojiIcon(place.type),
      }).addTo(map);

      bounds.extend([place.lat, place.lng]);

      const popup = L.popup({
        className: "custom-popup",
        closeButton: false,
        maxWidth: 220,
      }).setContent(`
        <div class="popup-content">
          <strong>${place.name}</strong>
          <span class="popup-type">${place.type}</span>
          <p>${place.distance} &middot; ${place.best_time || ""}</p>
          <button class="popup-btn" data-name="${place.name.replace(/"/g, "&quot;")}">View Details</button>
        </div>
      `);

      marker.bindPopup(popup);
    });

    if (validPlaces.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const userIcon = L.divIcon({
            className: "custom-marker",
            html: `<div class="user-dot"><div class="user-dot-ping"></div><div class="user-dot-core"></div></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 1000 })
            .addTo(map)
            .bindPopup(
              L.popup({ className: "custom-popup", closeButton: false, maxWidth: 160 })
                .setContent(`<div class="popup-content"><strong>You are here</strong></div>`)
            );
          bounds.extend([latitude, longitude]);
          map.fitBounds(bounds, { padding: [40, 40] });
        },
        () => {},
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    }

    map.getContainer().addEventListener("click", (e) => {
      const btn = e.target.closest(".popup-btn");
      if (btn) {
        const name = btn.getAttribute("data-name");
        const place = places.find((p) => p.name === name);
        if (place && onPlaceClick) onPlaceClick(place);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [places, onPlaceClick]);

  return (
    <div
      ref={mapRef}
      className="w-full rounded-2xl overflow-hidden border border-white/5"
      style={{ height: "calc(100vh - 180px)", minHeight: 400 }}
    />
  );
}
