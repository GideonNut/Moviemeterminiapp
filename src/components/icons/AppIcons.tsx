interface IconProps {
  size?: number;
  className?: string;
}

/** Gold star — 1st place */
export function GoldMedalIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2l2.35 6.76 7.15.14-5.8 4.34 2.1 6.86L12 16.52l-5.8 3.58 2.1-6.86L2.5 8.9l7.15-.14z"
        fill="#F5C542"
        stroke="#C89B10"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Hexagon badge — 2nd place */
export function SilverMedalIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2l8.66 5v10L12 22l-8.66-5V7z"
        fill="#B0BEC5"
        stroke="#90A0AB"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Shield — 3rd place */
export function BronzeMedalIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2l8 4.5v7c0 4.5-8 8.5-8 8.5S4 18 4 13.5v-7z"
        fill="#CD7C3A"
        stroke="#A85E20"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Ballot card with lines — voters tab */
export function VoterTabIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="4.5" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="4.5" y1="7.5" x2="9.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="4.5" y1="10" x2="7" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** Diamond gem — earners tab */
export function EarnerTabIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M7 1L13 5.5L7 13L1 5.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <line x1="1" y1="5.5" x2="13" y2="5.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="4.5" y1="5.5" x2="7" y2="1" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <line x1="9.5" y1="5.5" x2="7" y2="1" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

/** Lightning bolt — streaks tab */
export function StreakTabIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path
        d="M8.5 1L3 7.5h4L5.5 13 11 6.5H7z"
        fill="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Trophy outline — empty state */
export function TrophyEmptyIcon({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 2h12v7a6 6 0 01-12 0V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6 4H3a2 2 0 000 4h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M18 4h3a2 2 0 010 4h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 15v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 22h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Warning triangle */
export function WarningIcon({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.8" fill="currentColor" />
    </svg>
  );
}

/** Fortune wheel — daily spin */
export function SpinWheelIcon({ size = 24, className }: IconProps) {
  const R = 10;
  const cx = 12;
  const cy = 12;
  const spokes = 8;
  const lines = Array.from({ length: spokes }, (_, i) => {
    const angle = ((i * 360) / spokes) * (Math.PI / 180);
    return {
      x1: cx + 3.5 * Math.cos(angle),
      y1: cy + 3.5 * Math.sin(angle),
      x2: cx + R * Math.cos(angle),
      y2: cy + R * Math.sin(angle),
    };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx={cx} cy={cy} r={R} stroke="currentColor" strokeWidth="1.4" />
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      ))}
      <circle cx={cx} cy={cy} r={3} fill="currentColor" />
    </svg>
  );
}

/** Film frame — wheel center / movie icon */
export function FilmFrameIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="4" width="12" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <rect x="0.5" y="5.5" width="1.8" height="1.8" rx="0.4" fill="currentColor" />
      <rect x="0.5" y="8.7" width="1.8" height="1.8" rx="0.4" fill="currentColor" />
      <rect x="13.7" y="5.5" width="1.8" height="1.8" rx="0.4" fill="currentColor" />
      <rect x="13.7" y="8.7" width="1.8" height="1.8" rx="0.4" fill="currentColor" />
      <rect x="5.5" y="6" width="5" height="4" rx="0.6" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/** 4-pointed sparkle — celebration */
export function SparkleIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path
        d="M7 0L8.2 5.8L14 7L8.2 8.2L7 14L5.8 8.2L0 7L5.8 5.8z"
        fill="currentColor"
      />
    </svg>
  );
}
