import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Security Headers ─────────────────────────────────────────────────────
  // These headers protect against common web vulnerabilities.
  // They are sent with EVERY response from your Next.js server.
  async headers() {
    return [
      {
        source: "/(.*)", // Apply to all routes
        headers: [
          {
            // Prevents your app from being embedded in iframes (clickjacking)
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // Prevents browsers from guessing the content type (MIME sniffing attacks)
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // Controls how much referrer info is sent when navigating
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // Prevents browsers from making HTTP requests when on HTTPS
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // Controls which browser features are available (camera, mic, etc.)
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            // Content Security Policy — tells the browser which sources are trusted
            // This prevents XSS (Cross-Site Scripting) attacks
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // ─── Image Optimization ───────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
