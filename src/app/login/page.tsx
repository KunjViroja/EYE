"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Mail, Lock, ArrowRight } from "lucide-react";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@eye.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sign in & redirect to insights
    setTimeout(() => {
      router.push("/insights");
    }, 600);
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgGlow} aria-hidden="true" />

      <div className={styles.card}>
        <div className={styles.logoHeader}>
          <div className={styles.logoIcon}>
            <Eye size={24} color="#0D1117" strokeWidth={2.5} />
          </div>
          <h1 className={styles.title}>EYE Dashboard</h1>
          <p className={styles.subtitle}>Enter your credentials to access the atelier</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-email">Email Address</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@boutique.com"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={styles.input}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Signing in…" : "Sign In to Dashboard"}
          </button>
        </form>

        <div className={styles.demoHint}>
          <span className={styles.demoHighlight}>Demo Mode Active:</span>
          <br />
          Click Sign In to explore the dashboard.
        </div>
      </div>
    </div>
  );
}
