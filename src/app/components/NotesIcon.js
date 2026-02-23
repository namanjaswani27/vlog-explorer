"use client";

/**
 * Apple Notes–style icon: yellow notepad with horizontal lines.
 * Use className to control size (e.g. w-9 h-9 for header, w-16 h-16 for home).
 */
export default function NotesIcon({ className = "w-9 h-9" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Yellow notepad background - Apple Notes yellow */}
      <rect
        width="56"
        height="58"
        x="4"
        y="3"
        rx="6"
        ry="6"
        fill="#FECE44"
      />
      {/* Folded corner */}
      <path
        d="M54 3v14l-10 10H38L54 3z"
        fill="#E6B73D"
      />
      {/* Horizontal lines (ruled paper) */}
      <line x1="12" y1="18" x2="52" y2="18" stroke="#C9A227" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="26" x2="52" y2="26" stroke="#C9A227" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="34" x2="52" y2="34" stroke="#C9A227" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="42" x2="44" y2="42" stroke="#C9A227" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
