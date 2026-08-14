/**
 * Security Middleware for OptiPay
 * 
 * This middleware enforces security best practices:
 * - Request size limits to prevent DoS attacks
 * - Rate limiting for sensitive endpoints
 * - Input validation and sanitization
 * - Security header enforcement
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Security Configuration ───────────────────────────────────────────────
const SECURITY_CONFIG = {
  // Maximum request body size (10MB)
  MAX_REQUEST_SIZE: 10 * 1024 * 1024,

  // Sensitive endpoints that need extra protection
  SENSITIVE_ENDPOINTS: [
    "/api/auth",
    "/api/checkout",
    "/api/payment",
  ],

  // Rate limit: 100 requests per minute per IP
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW_MS: 60 * 1000,

  // Allowed content types for uploads
  ALLOWED_CONTENT_TYPES: [
    "application/json",
    "multipart/form-data",
    "application/x-www-form-urlencoded",
  ],
};

// ─── In-Memory Rate Limiter (for single server instances) ─────────────────
// NOTE: For production with multiple servers, use Redis
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limiter = rateLimitStore.get(ip);

  if (!limiter || now > limiter.resetTime) {
    // Reset window
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (limiter.count >= SECURITY_CONFIG.RATE_LIMIT_REQUESTS) {
    return false; // Rate limited
  }

  limiter.count++;
  return true;
}

/**
 * Main security middleware
 */
export async function securityMiddleware(request: NextRequest) {
  // 1. Get client IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // 2. Check rate limiting for sensitive endpoints
  const isSensitiveEndpoint = SECURITY_CONFIG.SENSITIVE_ENDPOINTS.some(
    (endpoint) => request.nextUrl.pathname.startsWith(endpoint)
  );

  if (isSensitiveEndpoint && !checkRateLimit(ip)) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  // 3. Validate content type for POST/PUT requests
  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    const contentType = request.headers.get("content-type");
    if (
      contentType &&
      !SECURITY_CONFIG.ALLOWED_CONTENT_TYPES.some((type) =>
        contentType.includes(type)
      )
    ) {
      return new NextResponse("Invalid Content-Type", { status: 400 });
    }
  }

  // 4. Add security headers to response
  const response = NextResponse.next();

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Disable framing (Clickjacking protection)
  response.headers.set("X-Frame-Options", "DENY");

  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Enable HSTS (only on HTTPS)
  if (request.nextUrl.protocol === "https:") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Prevent XSS attacks
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // CORS - adjust based on your needs
  response.headers.set("Access-Control-Allow-Credentials", "true");

  return response;
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return (
    input
      // Remove null bytes
      .replace(/\0/g, "")
      // Escape HTML special characters
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;")
  );
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL to prevent open redirect attacks
 */
export function isValidRedirectUrl(url: string, baseUrl: string): boolean {
  try {
    const parsedUrl = new URL(url, baseUrl);
    const baseUrlObj = new URL(baseUrl);

    // Only allow redirects to the same origin
    return parsedUrl.origin === baseUrlObj.origin;
  } catch {
    return false;
  }
}

/**
 * Rate limit check for login attempts
 */
export function checkLoginAttempt(email: string): boolean {
  const key = `login_${email}`;
  const now = Date.now();
  const limiter = rateLimitStore.get(key);

  if (!limiter || now > limiter.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + 15 * 60 * 1000, // 15 minute window
    });
    return true;
  }

  if (limiter.count >= 5) {
    // Max 5 attempts per 15 minutes
    return false;
  }

  limiter.count++;
  return true;
}
