type Tone = "mint" | "amber" | "blue" | "coral";

export const aiInsightCards = [
  {
    title: "Thursday Facial push",
    body: "12 inactive customers match this offer. One tap se WhatsApp blast ready hai.",
    tone: "mint" as Tone,
    action: "Send campaign",
  },
  {
    title: "Pending UPI follow-up",
    body: "Rs 3,200 abhi collect nahi hua. 7 PM se pehle gentle reminder bhejo.",
    tone: "amber" as Tone,
    action: "Remind now",
  },
  {
    title: "Staff load balance",
    body: "Anita 78% booked hai; Kavya ke 4 PM slot khali hain — walk-ins divert karo.",
    tone: "blue" as Tone,
    action: "View calendar",
  },
];

export const heatmapRows = [
  { time: "10a", values: [12, 18, 15, 22, 28, 35, 8] },
  { time: "12p", values: [28, 32, 30, 38, 42, 48, 14] },
  { time: "2p", values: [22, 26, 24, 30, 36, 40, 12] },
  { time: "4p", values: [45, 52, 48, 55, 62, 58, 20] },
  { time: "6p", values: [38, 44, 40, 48, 54, 50, 18] },
  { time: "8p", values: [18, 22, 20, 25, 30, 28, 10] },
];

export const automations = [
  {
    name: "Appointment reminder",
    detail: "24 hours pehle WhatsApp reminder — no-show kam hota hai.",
    result: "Last 30 days: 18% fewer no-shows",
  },
  {
    name: "Birthday offer",
    detail: "Customer birthday par 15% off message auto-send.",
    result: "Avg 6 redemptions / month",
  },
  {
    name: "Revisit nudge",
    detail: "45+ days inactive customers ko gentle revisit message.",
    result: "12 customers rebooked last month",
  },
  {
    name: "Owner daily report",
    detail: "Har raat 9 PM par revenue + bookings WhatsApp brief.",
    result: "Delivered daily to owner",
  },
];

export const branches = [
  {
    name: "Glow Studio — Koramangala",
    highlight: "Top performer",
    tone: "mint" as Tone,
    revenue: "Rs 18,400",
    bookings: "34",
    retention: "58%",
  },
  {
    name: "Glow Studio — Indiranagar",
    highlight: "Growing",
    tone: "blue" as Tone,
    revenue: "Rs 12,100",
    bookings: "22",
    retention: "51%",
  },
  {
    name: "Glow Studio — Whitefield",
    highlight: "Needs attention",
    tone: "amber" as Tone,
    revenue: "Rs 8,600",
    bookings: "15",
    retention: "44%",
  },
];
