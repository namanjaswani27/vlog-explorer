"use client";

import { useMemo } from "react";

const COLOR_VARIANTS = [
  "purple-pink",
  "blue-cyan",
  "orange-yellow",
  "green-emerald",
  "rose-pink",
  "violet-indigo",
];

const SIZE_VARIANTS = [
  { min: 15, max: 25, class: "butterfly-small" },
  { min: 25, max: 40, class: "butterfly-medium" },
  { min: 40, max: 60, class: "butterfly-large" },
];

export default function ButterflyBackground() {
  const butterflies = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const sizeVariant = SIZE_VARIANTS[Math.floor(Math.random() * SIZE_VARIANTS.length)];
    const size = sizeVariant.min + Math.random() * (sizeVariant.max - sizeVariant.min);
    const colorVariant = COLOR_VARIANTS[Math.floor(Math.random() * COLOR_VARIANTS.length)];
    return {
      id: i,
      delay: i * 1.8,
      duration: 18 + Math.random() * 20,
      startX: Math.random() * 100,
      startY: Math.random() * 100,
      size,
      colorVariant,
      sizeClass: sizeVariant.class,
    };
  }), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {butterflies.map((bf) => (
        <div
          key={bf.id}
          className={`absolute butterfly butterfly-${bf.colorVariant} ${bf.sizeClass}`}
          style={{
            left: `${bf.startX}%`,
            top: `${bf.startY}%`,
            width: `${bf.size}px`,
            height: `${bf.size}px`,
            animationDelay: `${bf.delay}s`,
            animationDuration: `${bf.duration}s`,
          }}
        >
          <div className="butterfly-body">
            <div className="butterfly-wing butterfly-wing-left">
              <div className="wing-gradient wing-gradient-1" />
              <div className="wing-gradient wing-gradient-2" />
            </div>
            <div className="butterfly-wing butterfly-wing-right">
              <div className="wing-gradient wing-gradient-1" />
              <div className="wing-gradient wing-gradient-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
