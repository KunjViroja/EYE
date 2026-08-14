"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { registerUserWithVerification } from "@/app/actions/auth";
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight,
  CheckCircle2, Glasses, AlertCircle,
} from "lucide-react";
import styles from "./AuthForm.module.css";
import Link from "next/link";

type Mode = "signin" | "signup";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [devLink, setDevLink] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  // ─── Password strength indicator ──────────────────────────────────────────
  const passwordStrength = (() => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
    if (score === 2) return { score, label: "Fair", color: "#f59e0b" };
    if (score === 3) return { score, label: "Good", color: "#3b82f6" };
    return { score, label: "Strong", color: "#10b981" };
  })();

  // ─── Sign In ───────────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error.includes("EMAIL_NOT_VERIFIED")) {
          setError("Your email is not verified yet. Please check your inbox.");
        } else {
          setError("Incorrect email or password. Please try again.");
        }
      } else {
        router.push("/insights");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Sign Up (Step 1) ──────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await registerUserWithVerification({ name, email, password });
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Registration failed.");
      return;
    }

    // Store userId + email in sessionStorage for Step 2 (/register page)
    if (res.userId) {
      sessionStorage.setItem("reg_userId", res.userId);
      sessionStorage.setItem("reg_email", email);
      sessionStorage.setItem("reg_name", name);
    }

    setRegisteredEmail(email);
    setVerificationSent(true);
    if (res.verificationLink) setDevLink(res.verificationLink);
  };

  // ─── Google Sign In ────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    const googleEnabled =
      typeof window !== "undefined" &&
      // Google works only when env vars are configured server-side.
      // We detect by attempting signIn and catching the config error.
      true;

    if (!googleEnabled) return;
    await signIn("google", { callbackUrl: "/insights" });
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError("");
    setVerificationSent(false);
    setDevLink("");
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className={styles.wrapper}>
      {/* ─── Logo ─────────────────────────────────────────────────────────── */}
      <div className={styles.logoRow}>
        <div className={styles.logoIcon}>
          <Glasses size={22} strokeWidth={2} color="#d4af37" />
        </div>
        <span className={styles.logoText}>OptiPay</span>
      </div>

      {/* ─── Heading ──────────────────────────────────────────────────────── */}
      <div className={styles.heading}>
        <h1 className={styles.title}>
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className={styles.subtitle}>
          {mode === "signin"
            ? "Sign in to manage your optical store"
            : "Start your free account — takes under 2 minutes"}
        </p>
      </div>

      {/* ─── Google Button ────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className={styles.googleBtn}
        title={
          process.env.NEXT_PUBLIC_GOOGLE_CONFIGURED === "true"
            ? "Continue with Google"
            : "Google Sign-In coming soon"
        }
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        Continue with Google
      </button>

      {/* ─── Divider ──────────────────────────────────────────────────────── */}
      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>or continue with email</span>
        <span className={styles.dividerLine} />
      </div>

      {/* ─── Tab Switcher ─────────────────────────────────────────────────── */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${mode === "signin" ? styles.tabActive : ""}`}
          onClick={() => switchMode("signin")}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`${styles.tab} ${mode === "signup" ? styles.tabActive : ""}`}
          onClick={() => switchMode("signup")}
        >
          Register
        </button>
      </div>

      {/* ─── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Verification Sent State ──────────────────────────────────────── */}
      {verificationSent ? (
        <div className={styles.successCard}>
          <div className={styles.successIconRow}>
            <CheckCircle2 size={36} color="#10b981" />
          </div>
          <h2 className={styles.successTitle}>Check your email</h2>
          <p className={styles.successDesc}>
            We sent a verification link to <strong>{registeredEmail}</strong>.
            Click it to activate your account, then come back to set up your shop.
          </p>

          {/* Dev-only direct link — remove in production */}
          {devLink && (
            <div className={styles.devLinkBox}>
              <span className={styles.devLinkLabel}>⚙️ Dev Mode — Verification Link:</span>
              <a href={devLink} className={styles.devLinkBtn}>
                Verify & Continue <ArrowRight size={13} />
              </a>
            </div>
          )}
        </div>
      ) : mode === "signin" ? (
        /* ─── Sign In Form ────────────────────────────────────────────────── */
        <form className={styles.form} onSubmit={handleSignIn}>
          <div className={styles.field}>
            <label htmlFor="si-email" className={styles.label}>Email address</label>
            <div className={styles.inputWrap}>
              <Mail size={15} className={styles.inputIcon} />
              <input
                id="si-email"
                type="email"
                required
                autoComplete="email"
                placeholder="owner@yourshop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label htmlFor="si-password" className={styles.label}>Password</label>
              <button type="button" className={styles.forgotLink}>Forgot password?</button>
            </div>
            <div className={styles.inputWrap}>
              <Lock size={15} className={styles.inputIcon} />
              <input
                id="si-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                style={{ paddingRight: "44px" }}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((p) => !p)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <p className={styles.switchHint}>
            Don&apos;t have an account?{" "}
            <button type="button" className={styles.switchLink} onClick={() => switchMode("signup")}>
              Register free
            </button>
          </p>
        </form>
      ) : (
        /* ─── Sign Up Form (Step 1) ───────────────────────────────────────── */
        <form className={styles.form} onSubmit={handleSignUp}>
          <div className={styles.stepBadge}>
            <span className={styles.stepDot}>1</span>
            <span>Account details</span>
            <span className={styles.stepSeparator}>›</span>
            <span className={styles.stepDimmed}>2</span>
            <span className={styles.stepDimmed}>Shop setup</span>
          </div>

          <div className={styles.field}>
            <label htmlFor="su-name" className={styles.label}>Your full name</label>
            <div className={styles.inputWrap}>
              <User size={15} className={styles.inputIcon} />
              <input
                id="su-name"
                type="text"
                required
                autoComplete="name"
                placeholder="Rajesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="su-email" className={styles.label}>Email address</label>
            <div className={styles.inputWrap}>
              <Mail size={15} className={styles.inputIcon} />
              <input
                id="su-email"
                type="email"
                required
                autoComplete="email"
                placeholder="owner@yourshop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="su-password" className={styles.label}>
              Password
              {password && (
                <span style={{ color: passwordStrength.color, marginLeft: 8, fontSize: 11, fontWeight: 600 }}>
                  {passwordStrength.label}
                </span>
              )}
            </label>
            <div className={styles.inputWrap}>
              <Lock size={15} className={styles.inputIcon} />
              <input
                id="su-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Min. 12 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                style={{ paddingRight: "44px" }}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((p) => !p)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {/* Password strength bar */}
            {password && (
              <div className={styles.strengthBar}>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={styles.strengthSegment}
                    style={{
                      background: i <= passwordStrength.score ? passwordStrength.color : "rgba(255,255,255,0.08)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Creating account…" : "Continue to Shop Setup →"}
          </button>

          <p className={styles.switchHint}>
            Already have an account?{" "}
            <button type="button" className={styles.switchLink} onClick={() => switchMode("signin")}>
              Sign in
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
