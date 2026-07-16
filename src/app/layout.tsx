import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Lumen LMS",
    template: "%s · Lumen LMS",
  },
  description:
    "Author courses, enroll, and learn with tracked progress — a Next.js Learning Management System.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
