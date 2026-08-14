import AuthForm from "@/components/auth/AuthForm";
import type { Metadata } from "next";
import styles from "./LoginPage.module.css";

export const metadata: Metadata = {
  title: "Sign In — OptiPay",
  description: "Sign in to OptiPay to manage your optical store, inventory, clients, and sales.",
};

export default function LoginPage() {
  return (
    <main className={styles.page}>
      {/* Ambient background glows */}
      <div className={styles.glowTopLeft} aria-hidden="true" />
      <div className={styles.glowBottomRight} aria-hidden="true" />

      {/* Centered form card */}
      <div className={styles.card}>
        <AuthForm />
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>© 2026 OptiPay</span>
        <span className={styles.footerDot}>·</span>
        <a href="#" className={styles.footerLink}>Privacy</a>
        <span className={styles.footerDot}>·</span>
        <a href="#" className={styles.footerLink}>Terms</a>
      </footer>
    </main>
  );
}
