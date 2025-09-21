interface IconProps {
  className?: string;
  size?: number;
}

export const TvIcon = ({ className = "", size = 20 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M22 16C22 18.8284 22 20.2426 21.1213 21.1213C20.2426 22 18.8284 22 16 22L8 22C5.17157 22 3.75736 22 2.87868 21.1213C2 20.2426 2 18.8284 2 16L2 12C2 9.17157 2 7.75736 2.87868 6.87868C3.75736 6 5.17157 6 8 6L16 6C18.8284 6 20.2426 6 21.1213 6.87868C22 7.75736 22 9.17157 22 12V16Z" 
      stroke="currentColor" 
      strokeWidth="1.5"
    /> 
    <path 
      d="M9 2L12 5.5L15 2" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    /> 
    <path 
      d="M16 6V22" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    /> 
    <circle cx="19" cy="16" r="1" fill="currentColor"/> 
    <circle cx="19" cy="12" r="1" fill="currentColor"/> 
  </svg>
);