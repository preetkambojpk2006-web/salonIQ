import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book appointment | SalonIQ",
  description: "Online salon booking",
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
