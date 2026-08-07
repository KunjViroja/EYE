"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { verifyEmailToken } from "@/app/actions/auth";
import Link from "next/link";
import { CheckCircle2, XCircle, RefreshCw, Eye } from "lucide-react";
import styles from "@/app/login/LoginPage.module.css";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
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
        setMessage("Invalid verification link.");
        return;
      }

      const res = await verifyEmailToken(email, token);
      setLoading(false);
      setSuccess(res.success);
      setMessage(res.error || res.message || "Email verified!");
    }

    executeVerification();
  }, [token, email]);

  return (
    <>
      {loading ? (
        <div style={{ padding: "24px 0", color: "#D4AF37", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <RefreshCw size={32} className={styles.spin} />
          <span>Validating security token…</span>
        </div>
      ) : success ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "16px 0" }}>
          <CheckCircle2 size={48} color="#10B981" />
          <p style={{ color: "white", fontSize: "14px" }}>{message}</p>
          <Link href="/login" className={styles.submitBtn} style={{ width: "100%", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            Sign In to Dashboard
          </Link>
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
    <div className={styles.page}>
      <div className={styles.bgGlow} aria-hidden="true" />

      <div className={styles.card} style={{ maxWidth: 440, textAlign: "center" }}>
        <div className={styles.logoHeader} style={{ alignItems: "center" }}>
          <div className={styles.logoIcon}>
            <Eye size={24} color="#0D1117" strokeWidth={2.5} />
          </div>
          <h1 className={styles.title}>Email Verification</h1>
          <p className={styles.subtitle}>Verifying your boutique email credentials</p>
        </div>

        <Suspense fallback={
          <div style={{ padding: "24px 0", color: "#D4AF37", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <RefreshCw size={32} className={styles.spin} />
            <span>Loading verification page…</span>
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
