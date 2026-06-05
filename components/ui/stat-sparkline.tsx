type StatAccentBarProps = {
  variant?: "green" | "neutral" | "cream" | "mint";
};

export function StatAccentBar({ variant = "green" }: StatAccentBarProps) {
  const className =
    variant === "neutral"
      ? "stat-accent-bar stat-accent-bar-neutral"
      : variant === "cream"
        ? "stat-accent-bar stat-accent-bar-cream"
        : variant === "mint"
          ? "stat-accent-bar stat-accent-bar-mint"
          : "stat-accent-bar stat-accent-bar-green";

  return <div className={className} aria-hidden />;
}
