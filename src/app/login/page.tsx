import AuthForm from "@/components/auth/AuthForm";
import { Eye, ShieldCheck, Sparkles } from "lucide-react";
import styles from "./LoginPage.module.css";

export const metadata = {
  title: "Atelier Portal — EYE Luxury Management",
  description: "Executive access portal for EYE Luxury Eyewear Atelier",
};

export default function LoginPage() {
  return (
    <div className={styles.page}>
      {/* ─── Left Editorial Showcase Panel ─────────────────────────────────── */}
      <section className={styles.leftShowcase}>
        <div className={styles.leftBgGlow} aria-hidden="true" />

        {/* Brand Header */}
        <div className={styles.brandHeader}>
          <div className={styles.brandLogoWrap}>
            <Eye size={22} color="#0A0D12" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className={styles.brandTitle}>EYE</h1>
            <p className={styles.brandSubtitle}>Lumina Atelier</p>
          </div>
        </div>

        {/* Editorial Body Statement */}
        <div className={styles.editorialBody}>
          <div className={styles.editorialTag}>
            <span className={styles.editorialTagLine} />
            Boutique Operations & Vision Blueprints
          </div>

          <h2 className={styles.statement}>
            Precision Vision.
            <br />
            <span className={styles.statementGold}>Unrivaled Luxury.</span>
          </h2>

          <p className={styles.editorialDesc}>
            Elevate bespoke optical client management, active prescriptions, and luxury collection curation with real-time analytics.
          </p>
        </div>

        {/* Status Node Footer */}
        <footer className={styles.leftFooter}>
          <div className={styles.nodeStatus}>
            <span className={styles.nodeDot} />
            <span>Supabase PostgreSQL Node Active</span>
          </div>
          <span>© 2026 EYE Inc.</span>
        </footer>
      </section>

      {/* ─── Right Glassmorphic Form Panel ─────────────────────────────────── */}
      <section className={styles.rightPanel}>
        <div className={styles.rightBgGlow} aria-hidden="true" />
        <AuthForm />
      </section>
    </div>
  );
}
