// ─── Root Layout ─────────────────────────────────────────────────────────────
// This file wraps EVERY page in the app.
// Think of it like a picture frame — the sidebar and fonts are the frame,
// and each page's content fills in the middle.
//
// This runs on the SERVER (no "use client" here) — it handles metadata and fonts.

import type { Metadata } from "next";
// Metadata = info that goes in the <head> tag (title, description for SEO)

import "./globals.css";
// Global styles apply to the entire app (resets, CSS variables, fonts)

import Sidebar from "@/components/layout/Sidebar";
import styles from "@/components/layout/AppShell.module.css";

// ─── SEO Metadata ─────────────────────────────────────────────────────────────
// This automatically generates <title> and <meta description> tags
// Good SEO = more traffic when you deploy publicly
export const metadata: Metadata = {
  title: {
    default: "Lumina Atelier",
    template: "%s | Lumina Atelier", // e.g. "Insights | Lumina Atelier"
  },
  description:
    "Premium eyewear boutique management dashboard — inventory, clientele, sales and executive insights.",
  robots: {
    index: false,  // Don't let search engines index this (it's an internal tool)
    follow: false,
  },
};

// ─── Root Layout Component ───────────────────────────────────────────────────
// children = whatever page is currently being rendered (Insights, Collections, etc.)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode; // TypeScript: children is any valid React content
}) {
  return (
    <html lang="en">
      {/*
        lang="en" is important for accessibility and SEO.
        Screen readers use this to know what language to use.
      */}
      <body>
        <div className={styles.appShell}>
          {/* Sidebar is rendered on EVERY page because it's in the root layout */}
          <Sidebar />

          {/* Main content area — each page's content renders here */}
          <main className={styles.mainContent} id="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
