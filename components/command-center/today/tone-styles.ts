export type Tone = "mint" | "amber" | "blue" | "coral";

export function toneCardClass(tone: Tone): string {
  switch (tone) {
    case "mint":
      return "border-mint/20 bg-mint-soft";
    case "amber":
      return "border-amber/25 bg-amber-soft";
    case "blue":
      return "border-blue/20 bg-blue-soft";
    case "coral":
      return "border-coral/25 bg-coral-soft";
  }
}

export function toneBarClass(tone: Tone): string {
  switch (tone) {
    case "mint":
      return "bg-mint";
    case "amber":
      return "bg-amber";
    case "blue":
      return "bg-blue";
    case "coral":
      return "bg-coral";
  }
}
