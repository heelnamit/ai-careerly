import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Matches | Careerly",
  description: "Your personal AI-powered job discovery and career assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
