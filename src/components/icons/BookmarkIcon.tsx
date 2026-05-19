interface BookmarkIconProps {
  size?: number;
  className?: string;
  filled?: boolean;
}

export function BookmarkIcon({ size = 24, className, filled = false }: BookmarkIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M6 4h12a1 1 0 0 1 1 1v15l-7-3.5L5 20V5a1 1 0 0 1 1-1z"
        fill={filled ? "#FACC15" : "none"}
        stroke={filled ? "#FACC15" : "currentColor"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
