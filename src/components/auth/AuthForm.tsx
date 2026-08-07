"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { registerUserWithVerification } from "@/app/actions/auth";
import { Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import styles from "@/app/login/LoginPage.module.css";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Verification state for email link
  const [verificationSent, setVerificationSent] = useState(false);
  const [devVerificationLink, setDevVerificationLink] = useState("");

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/insights" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "signin") {
      try {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (res?.error) {
          setError("Invalid email address or password.");
        } else {
          router.push("/insights");
          router.refresh();
        }
      } catch (err) {
        setError("Failed to sign in. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      // Registration & Email Verification Request
      const res = await registerUserWithVerification({ name, email, password });
      setLoading(false);

      if (!res.success) {
        setError(res.error || "Failed to initiate verification.");
      } else {
        setVerificationSent(true);
        if (res.verificationLink) {
          setDevVerificationLink(res.verificationLink);
        }
      }
    }
  };

  return (
    <div className={styles.formCard}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>
          {mode === "signin" ? "Atelier Portal" : "Join the Atelier"}
        </h2>
        <p className={styles.formSubtitle}>
          {mode === "signin"
            ? "Sign in to manage boutique operations & client blue-prints"
            : "Register for an executive boutique manager account"}
        </p>
      </div>

      {/* 1. Google OAuth 1-Click Button */}
      <button type="button" onClick={handleGoogleSignIn} className={styles.googleBtn}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Continue with Google
      </button>

      <div className={styles.dividerRow}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>or email verification</span>
        <span className={styles.dividerLine} />
      </div>

      {/* Mode Switcher Tabs */}
      <div className={styles.tabSwitch}>
        <button
          type="button"
          className={`${styles.tabBtn} ${mode === "signin" ? styles.tabBtnActive : ""}`}
          onClick={() => {
            setMode("signin");
            setError("");
            setVerificationSent(false);
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${mode === "signup" ? styles.tabBtnActive : ""}`}
          onClick={() => {
            setMode("signup");
            setError("");
            setVerificationSent(false);
          }}
        >
          Register & Verify
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Success Box after Verification Request */}
      {verificationSent ? (
        <div className={styles.successBox}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={18} color="#10B981" />
            <span className={styles.successTitle}>Verification Link Sent!</span>
          </div>
          <p className={styles.successDesc}>
            We have generated an email verification request for <strong>{email}</strong>. Please check your inbox and click the verification link to activate your account.
          </p>

          {devVerificationLink && (
            <div className={styles.verifyLinkWrap}>
              <span>⚙️ Dev Mode Direct Link:</span>
              <br />
              <a href={devVerificationLink} className={styles.verifyLinkBtn}>
                Verify Email Now <ArrowRight size={12} style={{ verticalAlign: "middle" }} />
              </a>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === "signup" && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="auth-name">Full Name</label>
              <div className={styles.inputWrap}>
                <User size={16} className={styles.inputIcon} />
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Julianne Moore"
                  className={styles.input}
                />
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="auth-email">Email Address</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@eye-boutique.com"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="auth-password">Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={styles.input}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading
              ? mode === "signin"
                ? "Signing in…"
                : "Generating Verification…"
              : mode === "signin"
              ? "Sign In to Atelier"
              : "Register & Send Verification"}
          </button>
        </form>
      )}
    </div>
  );
}
