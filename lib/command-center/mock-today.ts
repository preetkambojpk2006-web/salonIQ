export const todayMetrics = {
  revenue: {
    value: "Rs 18,400",
    context: "+22% vs last Friday",
    tone: "mint" as const,
  },
  bookings: {
    value: "34",
    context: "22 completed, 8 upcoming",
    tone: "blue" as const,
  },
  pending: {
    value: "Rs 3,200",
    context: "3 customers need follow-up",
    tone: "amber" as const,
  },
  repeat: {
    value: "58%",
    context: "Healthy retention",
    tone: "mint" as const,
  },
};

export const liveFlowSteps = [
  { id: 1, label: "Appointment completed", detail: "Sneha Sharma · Hair Spa" },
  { id: 2, label: "UPI payment received", detail: "Rs 1,800 · PhonePe" },
  { id: 3, label: "Dashboard updated", detail: "Today revenue +12%" },
];

export const nextAppointments = [
  {
    time: "4:00 PM",
    customer: "Sneha Sharma",
    service: "Facial",
    staff: "Anita",
    status: "confirmed" as const,
  },
  {
    time: "4:45 PM",
    customer: "Riya Mehta",
    service: "Haircut",
    staff: "Kavya",
    status: "confirmed" as const,
  },
  {
    time: "5:30 PM",
    customer: "Divya Nair",
    service: "Hair Spa",
    staff: "Anita",
    status: "pending" as const,
  },
  {
    time: "6:15 PM",
    customer: "Walk-in",
    service: "Threading",
    staff: "Reception",
    status: "walk-in" as const,
  },
];

export const aiInsights = [
  {
    title: "Follow up pending payments",
    body: "3 customers owe Rs 3,200. Send a gentle WhatsApp reminder before 7 PM.",
    tone: "amber" as const,
  },
  {
    title: "Peak hour tonight",
    body: "4 PM–7 PM is 78% booked. Block 15 min gaps for walk-ins only.",
    tone: "mint" as const,
  },
  {
    title: "Inactive customers",
    body: "12 customers haven't visited in 45+ days. Thursday Facial campaign is ready.",
    tone: "blue" as const,
  },
];

export const premiumStrip = [
  {
    label: "No-show risk",
    value: "2 customers",
    hint: "Send reminder now",
    tone: "coral" as const,
  },
  {
    label: "Best slot",
    value: "4 PM – 7 PM",
    hint: "Highest conversion window",
    tone: "mint" as const,
  },
  {
    label: "Next campaign",
    value: "Thursday Facial",
    hint: "Draft ready to send",
    tone: "blue" as const,
  },
];

export const whatsappBrief = {
  revenue: "Rs 18,400",
  customers: "34",
  whatsappShare: "64%",
};

export const bookingSources = [
  { label: "WhatsApp", pct: 64, tone: "mint" as const },
  { label: "Walk-ins", pct: 21, tone: "blue" as const },
  { label: "Phone", pct: 11, tone: "amber" as const },
  { label: "Instagram", pct: 4, tone: "coral" as const },
];

export const whatsappReportPreview = `🌿 Glow Studio — Daily Report

Revenue today: Rs 18,400
Bookings: 34 (22 done)
Pending: Rs 3,200

Top service: Hair Spa
Best staff: Anita

64% bookings via WhatsApp ✅`;
