export function getFirstName(
  email: string | undefined,
  displayName?: string | null
): string {
  const fromDisplay = displayName?.trim().split(/\s+/)[0];
  if (fromDisplay) {
    return (
      fromDisplay.charAt(0).toUpperCase() + fromDisplay.slice(1).toLowerCase()
    );
  }

  if (!email) return "Owner";

  const local = email.split("@")[0] ?? "";
  const part = local.split(/[._-]/)[0]?.trim() || local.trim();
  if (!part) return "Owner";

  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

export function getNamasteGreeting(
  email: string | undefined,
  displayName?: string | null
): string {
  return `Namaste, ${getFirstName(email, displayName)}!`;
}
