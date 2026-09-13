// Vaulty mark, redrawn for the "Newsprint Financial Page" direction as an
// inline SVG (theme-token colored, so it recolors with light/dark for free —
// the old raster PNG couldn't). Keeps the brand's required meaning: a lock
// that is also a coin slot, with a coin caught mid-drop into it, echoing
// "vault" + "piggy bank" the way the original mark did. The squircle plate
// radius matches the icon-tile rounding used for small badges elsewhere.
export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Vaulty"
    >
      {/* Plate — the vault door face. Squircle to match the icon-tile language used across the app. */}
      <rect x="0" y="0" width="40" height="40" rx="9" className="fill-accent" />

      {/* Keyhole is punched through the plate (shows the page background), doubling as a coin slot. */}
      <mask id="vaulty-keyhole-mask">
        <rect width="40" height="40" fill="white" />
        <circle cx="20" cy="16.5" r="5.4" fill="black" />
        <path d="M16.6 19.5 L23.4 19.5 L21.3 28 L18.7 28 Z" fill="black" />
      </mask>
      <rect x="0" y="0" width="40" height="40" rx="9" className="fill-bg" mask="url(#vaulty-keyhole-mask)" />

      {/* Coin, caught mid-drop toward the slot — the "vault/piggy bank" half of the mark. */}
      <circle cx="29" cy="10" r="5.5" className="fill-bg" stroke="currentColor" strokeWidth="1.6" />
      <line x1="26.6" y1="10" x2="31.4" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
