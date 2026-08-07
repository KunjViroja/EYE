// EyewearSilhouette — SVG placeholder for product images
// This is a clean glasses icon drawn with SVG paths.
// In Phase 2, real product photos from the database will replace this.
//
// HOW SVG WORKS:
// SVG (Scalable Vector Graphics) is like HTML for drawings.
// <path d="M..."> is a series of drawing commands:
//   M = Move to   L = Line to   C = Curve   Z = Close path

interface Props {
  color?: string;
  size?: number;
}

export default function EyewearSilhouette({ color = "#C9A96E", size = 56 }: Props) {
  return (
    <svg
      width={size}
      height={size * 0.5}
      viewBox="0 0 80 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Left lens */}
      <rect x="2" y="6" width="30" height="22" rx="11" stroke={color} strokeWidth="2.5" />
      {/* Right lens */}
      <rect x="48" y="6" width="30" height="22" rx="11" stroke={color} strokeWidth="2.5" />
      {/* Bridge connecting the two lenses */}
      <path d="M32 17 C34 13 46 13 48 17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Left temple (arm) */}
      <path d="M2 17 L-2 17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Right temple (arm) */}
      <path d="M78 17 L82 17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
