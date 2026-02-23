"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import FeatureTip, { isTipUnseen } from "./components/FeatureTip";
import ItineraryModal from "./components/ItineraryModal";
import NotesModal from "./components/NotesModal";
import NotesIcon from "./components/NotesIcon";
import ButterflyBackground from "./components/ButterflyBackground";

const MapView = dynamic(() => import("./components/MapView"), { ssr: false });

const TYPE_COLORS = {
  temple: "bg-amber-500/30 text-amber-200",
  cafe: "bg-orange-500/30 text-orange-200",
  park: "bg-emerald-500/30 text-emerald-200",
  market: "bg-rose-500/30 text-rose-200",
  monument: "bg-violet-500/30 text-violet-200",
  museum: "bg-blue-500/30 text-blue-200",
  nature: "bg-green-500/30 text-green-200",
  viewpoint: "bg-cyan-500/30 text-cyan-200",
  street: "bg-pink-500/30 text-pink-200",
  beach: "bg-sky-500/30 text-sky-200",
  lake: "bg-teal-500/30 text-teal-200",
  other: "bg-gray-500/30 text-gray-200",
};

const TYPE_ICONS = {
  temple: "🛕", cafe: "☕", park: "🌳", market: "🏪",
  monument: "🏛️", museum: "🎨", nature: "🌿", viewpoint: "🌄",
  street: "🚶", beach: "🏖️", lake: "🌊", other: "📍",
};

const CARD_HEIGHTS = [300, 360, 260, 400, 320, 280, 380, 340, 290, 350];

const STORAGE_KEY = "vlogspotter_saved";

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function persistSaved(places) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
  } catch {}
}

function BookmarkButton({ place, saved, onToggle }) {
  const isSaved = saved.some((s) => s.name === place.name);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(place); }}
      className={`absolute top-3 left-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer z-10 ${
        isSaved
          ? "bg-pink-500/80 text-white scale-110"
          : "bg-black/30 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-pink-500/60 hover:text-white"
      }`}
      title={isSaved ? "Remove from saved" : "Save this place"}
    >
      <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}

function ImageCard({ place, index, onClick, saved, onToggleSave }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const h = CARD_HEIGHTS[index % CARD_HEIGHTS.length];
  const color = TYPE_COLORS[place.type] || TYPE_COLORS.other;
  const icon = TYPE_ICONS[place.type] || TYPE_ICONS.other;

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("name", place.name);
    if (place.image_query) params.set("q", place.image_query);
    fetch(`/api/images?${params}`)
      .then((r) => r.json())
      .then((d) => { if (d.url) setImgUrl(d.url); })
      .catch(() => {});
  }, [place.image_query, place.name]);

  return (
    <div
      className="masonry-item animate-fade-up cursor-pointer group"
      style={{ animationDelay: `${index * 0.07}s` }}
      onClick={() => onClick(place, imgUrl)}
    >
      <div className="rounded-2xl overflow-hidden relative card-hover">
        <div className="relative" style={{ height: h }}>
          <div className="absolute inset-0 card-gradient" />
          {imgUrl && (
            <img
              src={imgUrl}
              alt={place.name}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
              loading="lazy"
              onLoad={() => setLoaded(true)}
            />
          )}
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl opacity-40">{icon}</span>
            </div>
          )}
          <BookmarkButton place={place} saved={saved} onToggle={onToggleSave} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
          <div className="absolute bottom-0 inset-x-0 p-4 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
            <span className={`type-badge px-2 py-0.5 rounded-full text-[10px] backdrop-blur-md ${color}`}>
              {icon} {place.type}
            </span>
            <h3 className="text-white font-semibold text-[15px] leading-snug mt-1.5 drop-shadow-lg">
              {place.name}
            </h3>
            <p className="text-white/50 text-xs mt-0.5">{place.distance}</p>
          </div>
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {place.name && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + (place.distance ? ` ${place.distance.split(' ')[0]} km` : ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-10 h-10 rounded-full bg-blue-500/30 backdrop-blur-md flex items-center justify-center hover:bg-blue-500/50 transition-all shadow-[0_0_12px_rgba(59,130,246,0.4)] hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                title="Open in Google Maps"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </a>
            )}
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MasonrySkeleton() {
  const heights = [280, 340, 240, 360, 300];
  return (
    <div className="masonry px-4 max-w-[1400px] mx-auto mt-8">
      {heights.map((h, i) => (
        <div key={i} className="masonry-item animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
          <div className="rounded-2xl overflow-hidden skeleton-card" style={{ height: h }}>
            <div className="absolute bottom-0 inset-x-0 p-4 space-y-2">
              <div className="h-3 w-16 rounded-full bg-white/10 shimmer" />
              <div className="h-4 w-3/4 rounded bg-white/10 shimmer" />
              <div className="h-3 w-1/2 rounded bg-white/8 shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailModal({ place, imageUrl, onClose, saved, onToggleSave }) {
  const [activeIdea, setActiveIdea] = useState(0);
  const isSaved = saved.some((s) => s.name === place.name);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!place) return null;

  const color = TYPE_COLORS[place.type] || TYPE_COLORS.other;
  const icon = TYPE_ICONS[place.type] || TYPE_ICONS.other;
  const ideas = place.vlog_ideas || [];
  const idea = ideas[activeIdea];

  return (
    <div className="fixed inset-0 z-50 modal-backdrop flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="relative w-full md:max-w-3xl md:max-h-[88vh] max-h-[92vh] bg-surface-light md:rounded-3xl rounded-t-3xl overflow-hidden modal-slide-up flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-56 md:h-72 shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={place.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full card-gradient" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-light via-surface-light/40 to-transparent" />
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => onToggleSave(place)}
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer ${
                isSaved ? "bg-pink-500/80 text-white" : "bg-black/40 text-white/80 hover:bg-pink-500/60"
              }`}
            >
              <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="absolute bottom-4 left-5 right-16">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`type-badge px-2.5 py-1 rounded-full text-[11px] backdrop-blur-md ${color}`}>
                {icon} {place.type}
              </span>
              {place.name && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium backdrop-blur-md bg-blue-500/30 text-blue-100 hover:bg-blue-500/50 transition-all border border-blue-400/25 shadow-[0_0_15px_rgba(59,130,246,0.35)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Open in Maps
                </a>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-2 drop-shadow-lg leading-tight">
              {place.name}
            </h2>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-white/60">
              <span>{place.distance}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{place.best_time}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-8">
          <p className="text-gray-400 text-sm leading-relaxed mt-4">{place.description}</p>

          {place.quick_tips && (
            <div className="flex flex-wrap gap-2 mt-4">
              {place.quick_tips.map((tip, i) => (
                <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/15">
                  {tip}
                </span>
              ))}
            </div>
          )}

          {ideas.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">Vlog Ideas</h3>

              {ideas.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
                  {ideas.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIdea(i)}
                      className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        activeIdea === i
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-surface-lighter/50 text-gray-500 border border-transparent hover:text-gray-300"
                      }`}
                    >
                      Idea {i + 1}
                    </button>
                  ))}
                </div>
              )}

              {idea && (
                <div className="space-y-5 animate-fade-up" key={activeIdea}>
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="text-xl">🎥</span> {idea.title}
                  </h4>

                  <div className="rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/15 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-orange-400 font-bold mb-1.5">Opening Hook</p>
                    <p className="text-[15px] text-orange-100 italic leading-relaxed">&ldquo;{idea.hook}&rdquo;</p>
                  </div>

                  {idea.script && (
                    <div className="rounded-xl bg-gradient-to-r from-purple-500/8 to-pink-500/8 border border-purple-500/12 p-4">
                      <p className="text-[10px] uppercase tracking-widest text-purple-400 font-bold mb-2">Full Voiceover Script</p>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{idea.script}</p>
                    </div>
                  )}

                  {idea.script_outline && !idea.script && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-purple-400 font-bold mb-2">Script Outline</p>
                      <p className="text-sm text-gray-400 leading-relaxed">{idea.script_outline}</p>
                    </div>
                  )}

                  {idea.reel_script && (
                    <div className="rounded-xl bg-gradient-to-r from-pink-500/8 to-rose-500/8 border border-pink-500/12 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">📱</span>
                        <p className="text-[10px] uppercase tracking-widest text-pink-400 font-bold">Instagram Reel Script</p>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{idea.reel_script}</p>
                    </div>
                  )}

                  {idea.shots && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-2">Cinematic Shot List</p>
                      <div className="space-y-2">
                        {idea.shots.map((shot, j) => (
                          <div key={j} className="flex items-start gap-2.5 text-sm">
                            <span className="shrink-0 w-5 h-5 rounded-md bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-[10px] font-bold mt-0.5">{j + 1}</span>
                            <span className="text-gray-400">{shot}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {idea.music_vibe && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/8 border border-emerald-500/12">
                      <span className="text-sm">🎵</span>
                      <span className="text-xs text-emerald-300">Music vibe: {idea.music_vibe}</span>
                    </div>
                  )}

                  {idea.hashtags && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {idea.hashtags.map((tag, j) => (
                        <span key={j} className="text-xs px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300/80">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searchLabel, setSearchLabel] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastQuery, setLastQuery] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [saved, setSaved] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [activeTipIdx, setActiveTipIdx] = useState(0);
  const inputRef = useRef(null);
  const saveButtonRef = useRef(null);
  const mapToggleRef = useRef(null);
  const suggestMoreRef = useRef(null);
  const itineraryRef = useRef(null);

  const TIPS = [
    {
      id: "tip_save_place",
      ref: saveButtonRef,
      title: "Save your favourites",
      description: "Tap the heart on any place card to bookmark it for your trip planning.",
      placement: "left",
    },
    {
      id: "tip_map_view",
      ref: mapToggleRef,
      title: "Map view",
      description: "Switch to map view to see all suggested places on an interactive map with your location.",
      placement: "bottom",
    },
    {
      id: "tip_suggest_more",
      ref: suggestMoreRef,
      title: "Discover more spots",
      description: "Want more? Tap here to get 5 more hidden gems the AI hasn't suggested yet.",
      placement: "top",
    },
    {
      id: "tip_itinerary",
      ref: itineraryRef,
      title: "Smart Itinerary",
      description: "Save 2+ places, then tap here to auto-build an optimized day-wise trip plan with travel times.",
      placement: "bottom",
    },
  ];

  const advanceTip = useCallback(() => {
    setActiveTipIdx((prev) => prev + 1);
  }, []);

  const skipAllTips = useCallback(() => {
    setActiveTipIdx(TIPS.length);
  }, [TIPS.length]);

  useEffect(() => {
    setSaved(loadSaved());
  }, []);

  const toggleSave = useCallback((place) => {
    setSaved((prev) => {
      const exists = prev.some((s) => s.name === place.name);
      const next = exists
        ? prev.filter((s) => s.name !== place.name)
        : [...prev, place];
      persistSaved(next);
      return next;
    });
  }, []);

  const searchByQuery = useCallback(async (query) => {
    if (!query.trim()) return;
    setStatus("loading");
    setError(null);
    setData(null);
    setSearchLabel(query.trim());
    setLastQuery({ query: query.trim() });
    setShowSaved(false);
    setViewMode("grid");

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to get suggestions");
      }
      const result = await res.json();
      setData(result);
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }, []);

  const searchByLocation = useCallback(async () => {
    setStatus("locating");
    setError(null);
    setData(null);
    setSearchLabel("your location");
    setShowSaved(false);
    setViewMode("grid");

    try {
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported by your browser"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      setLastQuery({ latitude, longitude });
      setStatus("loading");

      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to get suggestions");
      }
      const result = await res.json();
      setSearchLabel(result.area_name || "your location");
      setData(result);
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!lastQuery || !data?.places) return;
    setLoadingMore(true);

    try {
      const exclude = data.places.map((p) => p.name);
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lastQuery, exclude }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to load more");
      }
      const result = await res.json();
      if (result.places?.length) {
        setData((prev) => ({
          ...prev,
          places: [...prev.places, ...result.places],
        }));
      }
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [lastQuery, data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    searchByQuery(searchText);
  };

  const handleCardClick = (place, imageUrl) => {
    setSelectedPlace(place);
    setSelectedImage(imageUrl || null);
  };

  const handleMapPlaceClick = (place) => {
    setSelectedPlace(place);
    setSelectedImage(null);
  };

  const isIdle = status === "idle" && !showSaved;
  const displayPlaces = showSaved ? saved : data?.places;
  const hasResults = (status === "done" && data) || showSaved;

  return (
    <div className="min-h-screen gradient-bg relative">
      {/* Butterfly Background */}
      <ButterflyBackground />
      
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-40 glass border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center gap-4">
          {/* Back button — shows when in Saved view while results exist */}
          {showSaved && status === "done" && data && (
            <button
              onClick={() => setShowSaved(false)}
              className="shrink-0 w-9 h-9 rounded-xl bg-surface-lighter/50 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-surface-lighter/80 transition-all cursor-pointer"
              title="Back to results"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <button
            onClick={() => { setShowSaved(false); if (status !== "done") setStatus("idle"); }}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">V</div>
            <span className="font-semibold text-white tracking-tight hidden sm:block">
              VlogSpotter
            </span>
          </button>

          {!isIdle && (
            <form onSubmit={handleSubmit} className="flex-1 max-w-xl">
              <div className="flex items-center bg-surface-lighter/70 rounded-xl border border-white/5 focus-within:border-purple-500/30 transition-colors">
                <svg className="w-4 h-4 text-gray-500 ml-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search another place..."
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none"
                />
                <button
                  type="button"
                  onClick={searchByLocation}
                  title="Use my location"
                  className="px-3 py-2.5 text-gray-500 hover:text-purple-400 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </form>
          )}

          {/* Notes button — next to Saved, Apple Notes icon */}
          <button
            onClick={() => setShowNotes(true)}
            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-surface-lighter/50 text-gray-400 border border-white/5 hover:opacity-90 transition-all cursor-pointer"
            title="Notes"
          >
            <NotesIcon className="w-5 h-5" />
          </button>

          {/* Saved button */}
          <button
            ref={saveButtonRef}
            onClick={() => { setShowSaved(!showSaved); setViewMode("grid"); }}
            className={`relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              showSaved
                ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                : "bg-surface-lighter/50 text-gray-400 border border-white/5 hover:text-pink-400"
            }`}
            title="Saved places"
          >
            <svg className="w-4.5 h-4.5" fill={showSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {saved.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
                {saved.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero */}
        {isIdle && (
          <section className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4">
            <div className="animate-float mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center text-4xl shadow-2xl shadow-purple-500/20">
                🕊️
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              Discover Places to{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Vlog
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-lg mb-10 leading-relaxed">
              Search any city or destination. Get stunning sub-locations with AI-generated vlog scripts, hooks, shot lists, and tips.
            </p>

            <form onSubmit={handleSubmit} className="w-full max-w-lg mb-4">
              <div className="flex items-center bg-surface-lighter/80 rounded-2xl border border-white/8 focus-within:border-purple-500/40 transition-all focus-within:shadow-lg focus-within:shadow-purple-500/10">
                <svg className="w-5 h-5 text-gray-500 ml-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Try 'Jaipur', 'Paris cafes', 'Bali beaches'..."
                  className="flex-1 bg-transparent px-4 py-4 text-base text-white placeholder-gray-500 outline-none"
                />
                <button
                  type="submit"
                  className="mr-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:from-purple-500 hover:to-pink-500 transition-all cursor-pointer"
                >
                  Explore
                </button>
              </div>
            </form>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600">or</span>
              <button
                onClick={searchByLocation}
                className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Use my current location
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {["Jaipur", "Tokyo", "Paris", "Bali", "New York", "Santorini"].map((q) => (
                <button
                  key={q}
                  onClick={() => { setSearchText(q); searchByQuery(q); }}
                  className="px-4 py-2 rounded-full text-xs text-gray-400 bg-surface-lighter/50 border border-white/5 hover:border-purple-500/20 hover:text-purple-300 transition-all cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Notes — Apple Notes logo on home */}
            <button
              onClick={() => setShowNotes(true)}
              className="mt-12 flex flex-col items-center gap-3 p-6 rounded-3xl glass border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
            >
              <div className="rounded-2xl shadow-lg group-hover:scale-105 transition-transform">
                <NotesIcon className="w-16 h-16" />
              </div>
              <span className="text-lg font-semibold text-white/90">Notes</span>
            </button>
          </section>
        )}

        {/* Locating */}
        {status === "locating" && !showSaved && (
          <section className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin mb-6" />
            <p className="text-lg text-gray-300">Getting your location...</p>
            <p className="text-sm text-gray-500 mt-1">Please allow location access</p>
          </section>
        )}

        {/* Loading */}
        {status === "loading" && !showSaved && (
          <section>
            <div className="text-center mt-8 mb-2">
              <div className="inline-flex items-center gap-3 glass rounded-full px-6 py-3 animate-pulse-glow">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-sm text-purple-300">Discovering spots in {searchLabel}...</span>
              </div>
            </div>
            <MasonrySkeleton />
          </section>
        )}

        {/* Error */}
        {status === "error" && !showSaved && (
          <section className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-3xl mb-4">😔</div>
            <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-400 max-w-sm mb-6">{error}</p>
            <button
              onClick={() => searchLabel === "your location" ? searchByLocation() : searchByQuery(searchLabel)}
              className="px-6 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-500 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </section>
        )}

        {/* Results / Saved */}
        {hasResults && displayPlaces && (
          <section className="pb-20">
            <div className="max-w-[1400px] mx-auto px-4 pt-6">
              {/* Header area */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="animate-fade-up">
                  {showSaved ? (
                    <>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-2xl md:text-3xl font-bold text-white">Saved Places</h2>
                        {saved.length >= 2 && (
                          <button
                            ref={itineraryRef}
                            onClick={() => setShowItinerary(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 transition-all cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.4),0_0_40px_rgba(168,85,247,0.15)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5),0_0_50px_rgba(168,85,247,0.2)] animate-pulse-glow"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Build Itinerary
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{saved.length} place{saved.length !== 1 ? "s" : ""} saved</p>
                    </>
                  ) : data?.area_vibe ? (
                    <>
                      <h2 className="text-2xl md:text-3xl font-bold text-white">{data.area_name}</h2>
                      <p className="text-sm text-gray-500 italic mt-0.5">{data.area_vibe}</p>
                    </>
                  ) : null}
                </div>

                {/* View toggle */}
                {displayPlaces.length > 0 && (
                  <div className="flex items-center gap-1 bg-surface-lighter/50 rounded-xl p-1 border border-white/5">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        viewMode === "grid" ? "bg-purple-500/20 text-purple-300" : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Grid
                    </button>
                    <button
                      ref={mapToggleRef}
                      onClick={() => setViewMode("map")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        viewMode === "map" ? "bg-purple-500/20 text-purple-300" : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Map
                    </button>
                  </div>
                )}
              </div>

              {/* Empty saved state */}
              {showSaved && saved.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center text-3xl mx-auto mb-4">
                    <svg className="w-8 h-8 text-pink-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No saved places yet</h3>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    Tap the heart icon on any place to save it for your trip planning.
                  </p>
                </div>
              )}

              {/* Grid view */}
              {viewMode === "grid" && displayPlaces.length > 0 && (
                <div className="masonry">
                  {displayPlaces.map((place, i) => (
                    <ImageCard
                      key={`${place.name}-${i}`}
                      place={place}
                      index={i}
                      onClick={handleCardClick}
                      saved={saved}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </div>
              )}

              {/* Map view */}
              {viewMode === "map" && displayPlaces.length > 0 && (
                <MapView places={displayPlaces} onPlaceClick={handleMapPlaceClick} />
              )}

              {/* Suggest more (only in search results grid) */}
              {!showSaved && viewMode === "grid" && (
                <div className="text-center mt-10">
                  <button
                    ref={suggestMoreRef}
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-7 py-3.5 rounded-2xl glass border border-purple-500/20 text-purple-300 font-medium hover:bg-purple-500/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2.5">
                        <span className="w-4 h-4 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
                        Finding more spots...
                      </span>
                    ) : (
                      "Suggest More Places"
                    )}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      {(hasResults || isIdle) && (
        <footer className="border-t border-white/5 py-6">
          <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between text-xs text-gray-600">
            <span>VlogSpotter</span>
            <span>Powered by GPT-4o mini</span>
          </div>
        </footer>
      )}

      {/* Detail Modal */}
      {selectedPlace && (
        <DetailModal
          place={selectedPlace}
          imageUrl={selectedImage}
          onClose={() => { setSelectedPlace(null); setSelectedImage(null); }}
          saved={saved}
          onToggleSave={toggleSave}
        />
      )}

      {/* Itinerary Modal */}
      {showItinerary && saved.length >= 2 && (
        <ItineraryModal
          places={saved}
          onClose={() => setShowItinerary(false)}
        />
      )}

      {/* Notes Modal */}
      {showNotes && (
        <NotesModal onClose={() => setShowNotes(false)} />
      )}

      {/* Feature tips — show one at a time after results load */}
      {hasResults && !selectedPlace && (() => {
        const pending = TIPS.filter((t) => isTipUnseen(t.id));
        const tip = pending.length > 0 && activeTipIdx < TIPS.length
          ? TIPS.find((t) => t.id === (pending[Math.min(activeTipIdx, pending.length - 1)]?.id))
          : null;
        if (!tip) return null;
        return (
          <FeatureTip
            key={tip.id}
            id={tip.id}
            targetRef={tip.ref}
            title={tip.title}
            description={tip.description}
            placement={tip.placement}
            onDismiss={advanceTip}
            onSkipAll={skipAllTips}
          />
        );
      })()}
    </div>
  );
}
