type IconProps = {
  className?: string;
  size?: number;
  children: React.ReactNode;
};

/** Fixed-size SVG wrapper — prevents flex/grid from stretching icons. */
export function Icon({ className = "", size = 20, children }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`block shrink-0 ${className}`}
      aria-hidden
    >
      {children}
    </svg>
  );
}
