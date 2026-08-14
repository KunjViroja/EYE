"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Glasses, Package, Users, ShoppingCart, ArrowRight, Sparkles } from "lucide-react";
import styles from "./WelcomePage.module.css";

const QUICK_ACTIONS = [
  {
    icon: Package,
    title: "Add your first product",
    desc: "Add frames, lenses, or accessories to your inventory",
    href: "/collections",
    color: "#d4af37",
  },
  {
    icon: Users,
    title: "Register your first client",
    desc: "Add a customer profile and their eye prescription",
    href: "/clientele",
    color: "#38bdf8",
  },
  {
    icon: ShoppingCart,
    title: "Make your first sale",
    desc: "Process a billing transaction from the POS terminal",
    href: "/pos",
    color: "#10b981",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [shopName, setShopName] = useState("Your Shop");

  useEffect(() => {
    // Try to get shop name from session/localStorage if set during onboarding
    const stored = localStorage.getItem("shopName");
    if (stored) setShopName(stored);
  }, []);

  const handleStartTour = () => {
    localStorage.setItem("optipay_onboarding_completed", "true");
    router.push("/insights?tour=true");
  };

  const handleGoToDashboard = () => {
    localStorage.setItem("optipay_onboarding_completed", "true");
    router.push("/insights");
  };

  const handleActionClick = (href: string) => {
    localStorage.setItem("optipay_onboarding_completed", "true");
    router.push(href);
  };

  return (
    <main className={styles.page}>
      <div className={styles.glowCenter} aria-hidden="true" />

      <div className={styles.card}>
        {/* ─── Logo ──────────────────────────────────────────────────────── */}
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}>
            <Glasses size={22} strokeWidth={2} color="#d4af37" />
          </div>
          <span className={styles.logoText}>OptiPay</span>
        </div>

        {/* ─── Hero ──────────────────────────────────────────────────────── */}
        <div className={styles.hero}>
          <div className={styles.sparkleRow}>
            <Sparkles size={16} color="#d4af37" />
            <span>You&apos;re all set!</span>
          </div>
          <h1 className={styles.heroTitle}>
            Welcome to OptiPay 🎉
          </h1>
          <p className={styles.heroDesc}>
            Your optical store is live. Explore the guided walkthrough or jump straight in.
          </p>
        </div>

        {/* ─── Quick Actions ─────────────────────────────────────────────── */}
        <div className={styles.actions}>
          {QUICK_ACTIONS.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={action.href}
                type="button"
                className={styles.actionCard}
                onClick={() => handleActionClick(action.href)}
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className={styles.actionLeft}>
                  <div className={styles.actionNum} style={{ color: action.color }}>
                    {idx + 1}
                  </div>
                  <div className={styles.actionIconWrap} style={{ background: `${action.color}18`, border: `1px solid ${action.color}30` }}>
                    <Icon size={18} color={action.color} />
                  </div>
                  <div className={styles.actionText}>
                    <span className={styles.actionTitle}>{action.title}</span>
                    <span className={styles.actionDesc}>{action.desc}</span>
                  </div>
                </div>
                <ArrowRight size={16} className={styles.actionArrow} />
              </button>
            );
          })}
        </div>

        {/* ─── Buttons ───────────────────────────────────────────────────── */}
        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={styles.tourBtn}
            onClick={handleStartTour}
          >
            <Sparkles size={16} />
            Start Interactive Tour
            <ArrowRight size={15} />
          </button>

          <button
            type="button"
            className={styles.dashboardBtn}
            onClick={handleGoToDashboard}
          >
            Go to Dashboard
          </button>
        </div>

        <p className={styles.footerNote}>
          You can always explore all features from the sidebar navigation.
        </p>
      </div>
    </main>
  );
}
