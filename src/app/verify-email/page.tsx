"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmailToken } from "@/app/actions/auth";
import Link from "next/link";
import { CheckCircle2, XCircle, RefreshCw, Glasses } from "lucide-react";
import styles from "./VerifyEmailPage.module.css";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function executeVerification() {
      if (!token || !email) {
        setLoading(false);
        setSuccess(false);
        setMessage("Invalid verification link. Please register again.");
        return;
      }

      const res = await verifyEmailToken(email, token);
      setLoading(false);
      setSuccess(res.success);
      setMessage(res.error || res.message || "Email verified!");

      // On success, redirect to /welcome after a short delay
      if (res.success) {
        setTimeout(() => router.push("/welcome"), 2000);
      }
    }

    executeVerification();
  }, [token, email, router]);

  return (
    <>
      {loading ? (
        <div style={{ padding: "24px 0", color: "#d4af37", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <RefreshCw size={28} className={styles.spin} />
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>Validating your token…</span>
        </div>
      ) : success ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "16px 0" }}>
          <CheckCircle2 size={48} color="#10b981" strokeWidth={1.5} />
          <p style={{ color: "white", fontSize: "15px", fontWeight: 600 }}>Email Verified!</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", textAlign: "center" }}>Redirecting you to your shop dashboard…</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "16px 0" }}>
          <XCircle size={48} color="#EF4444" />
          <p style={{ color: "#F87171", fontSize: "14px" }}>{message}</p>
          <Link href="/login" className={styles.link}>
            Return to Login
          </Link>
        </div>
      )}
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className={styles.page}>
      <div className={styles.glowTopLeft} aria-hidden="true" />

      <div className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}>
            <Glasses size={22} strokeWidth={2} color="#d4af37" />
          </div>
          <span className={styles.logoText}>OptiPay</span>
        </div>

        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#ffffff", marginBottom: 6 }}>Email Verification</h1>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)" }}>Verifying your account email address</p>
        </div>

        <Suspense fallback={
          <div style={{ padding: "24px 0", color: "#d4af37", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <RefreshCw size={28} className={styles.spin} />
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>Loading…</span>
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </main>
  );
}
