import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireEase Services | Your next chapter in AI",
  description: "Explore AI roles, build your talent profile, and connect with recruiting partners through HireEase Services.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
