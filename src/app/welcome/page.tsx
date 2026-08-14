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
            Your optical store is live. Here&apos;s how to get started in just 3 steps.
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
                onClick={() => router.push(action.href)}
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

        {/* ─── Skip to Dashboard ─────────────────────────────────────────── */}
        <button
          type="button"
          className={styles.dashboardBtn}
          onClick={() => router.push("/insights")}
        >
          Go to Dashboard
          <ArrowRight size={15} />
        </button>

        <p className={styles.footerNote}>
          You can always find these in the sidebar navigation.
        </p>
      </div>
    </main>
  );
}
