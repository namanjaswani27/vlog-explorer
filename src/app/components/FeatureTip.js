"use client";

import { useState, useEffect, useCallback } from "react";

const TIPS_SEEN_KEY = "vs_tips_seen";
const SKIP_ALL_KEY = "vs_tips_skip_all";

function getSeenTips() {
  try {
    return JSON.parse(localStorage.getItem(TIPS_SEEN_KEY) || "[]");
  } catch {
    return [];
  }
}

function markSeen(id) {
  const seen = getSeenTips();
  if (!seen.includes(id)) {
    seen.push(id);
    localStorage.setItem(TIPS_SEEN_KEY, JSON.stringify(seen));
  }
}

function isAllSkipped() {
  try {
    return localStorage.getItem(SKIP_ALL_KEY) === "true";
  } catch {
    return false;
  }
}

function skipAll() {
  localStorage.setItem(SKIP_ALL_KEY, "true");
}

export function isTipUnseen(id) {
  return !isAllSkipped() && !getSeenTips().includes(id);
}

function computePosition(rect, placement, tooltipW, tooltipH) {
  const gap = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top, left;
  let resolvedPlacement = placement;

  if (placement === "bottom") {
    top = rect.bottom + gap;
    left = rect.left + rect.width / 2 - tooltipW / 2;
    if (top + tooltipH > vh - 16) resolvedPlacement = "top";
  }
  if (placement === "top" || resolvedPlacement === "top") {
    top = rect.top - gap - tooltipH;
    left = rect.left + rect.width / 2 - tooltipW / 2;
    if (top < 16) {
      top = rect.bottom + gap;
      resolvedPlacement = "bottom";
    } else {
      resolvedPlacement = "top";
    }
  }
  if (placement === "left") {
    top = rect.top + rect.height / 2 - tooltipH / 2;
    left = rect.left - gap - tooltipW;
    if (left < 16) {
      left = rect.right + gap;
      resolvedPlacement = "right";
    }
  }
  if (placement === "right") {
    top = rect.top + rect.height / 2 - tooltipH / 2;
    left = rect.right + gap;
    if (left + tooltipW > vw - 16) {
      left = rect.left - gap - tooltipW;
      resolvedPlacement = "left";
    }
  }

  left = Math.max(12, Math.min(left, vw - tooltipW - 12));
  top = Math.max(12, Math.min(top, vh - tooltipH - 12));

  return { top, left, resolvedPlacement };
}

export default function FeatureTip({
  id,
  targetRef,
  title,
  description,
  placement = "bottom",
  onDismiss,
  onSkipAll,
}) {
  const [rect, setRect] = useState(null);
  const [visible, setVisible] = useState(false);
  const [tooltipSize, setTooltipSize] = useState({ w: 280, h: 120 });
  const [tooltipRef, setTooltipRef] = useState(null);

  useEffect(() => {
    if (isAllSkipped() || getSeenTips().includes(id)) return;

    const timer = setTimeout(() => {
      if (targetRef?.current) {
        setRect(targetRef.current.getBoundingClientRect());
        setVisible(true);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [id, targetRef]);

  useEffect(() => {
    if (!visible || !targetRef?.current) return;

    const update = () => {
      const r = targetRef.current?.getBoundingClientRect();
      if (r) setRect(r);
    };

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [visible, targetRef]);

  useEffect(() => {
    if (tooltipRef) {
      const r = tooltipRef.getBoundingClientRect();
      setTooltipSize({ w: r.width, h: r.height });
    }
  }, [tooltipRef, visible]);

  const handleDismiss = useCallback(() => {
    markSeen(id);
    setVisible(false);
    onDismiss?.();
  }, [id, onDismiss]);

  const handleSkipAll = useCallback(() => {
    skipAll();
    setVisible(false);
    onSkipAll?.();
  }, [onSkipAll]);

  if (!visible || !rect) return null;

  const pos = computePosition(rect, placement, tooltipSize.w, tooltipSize.h);

  const arrowDir =
    pos.resolvedPlacement === "bottom"
      ? "top"
      : pos.resolvedPlacement === "top"
        ? "bottom"
        : pos.resolvedPlacement === "left"
          ? "right"
          : "left";

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Dark overlay — click anywhere to dismiss */}
      <div className="fixed inset-0" onClick={handleDismiss} />

      {/* Spotlight cutout */}
      <div
        className="spotlight-cutout"
        style={{
          position: "fixed",
          left: rect.left - 6,
          top: rect.top - 6,
          width: rect.width + 12,
          height: rect.height + 12,
          borderRadius: 12,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
          pointerEvents: "none",
        }}
      />

      {/* Tooltip card */}
      <div
        ref={setTooltipRef}
        className="spotlight-tooltip"
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`spotlight-arrow spotlight-arrow-${arrowDir}`} />
        <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
        <div className="flex items-center justify-between gap-3 mt-3.5">
          <button
            onClick={handleSkipAll}
            className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            Skip all tips
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold hover:from-purple-500 hover:to-pink-500 transition-all cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
