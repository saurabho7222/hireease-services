import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Training Jobs from Top AI Platforms in One Feed | HireEase Talent Network",
  description: "Stop refreshing a dozen job boards. HireEase Talent Network pulls remote AI training jobs from top AI platforms into one feed and matches them to your skills. 100% free to join.",
  keywords: [
    "AI training jobs",
    "data annotation",
    "RLHF training",
    "LLM evaluation",
    "subject matter expert",
    "clinical review",
    "legal AI review",
    "remote AI jobs"
  ],
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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
