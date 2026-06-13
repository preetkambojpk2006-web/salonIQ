import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Walk-in queue | SalonIQ",
  description: "Salon walk-in virtual queue",
};

export default function QueueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
