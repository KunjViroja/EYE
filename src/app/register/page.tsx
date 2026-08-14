"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { completeShopSetup } from "@/app/actions/auth";
import {
  Store, MapPin, Phone, ChevronRight, Glasses,
  CheckCircle2, AlertCircle, Building2,
} from "lucide-react";
import styles from "./RegisterPage.module.css";

const SHOP_TYPES = [
  { value: "RETAIL_OPTICAL", label: "Retail Optical Store", desc: "Frames, lenses, sunglasses retail" },
  { value: "EYE_CLINIC", label: "Eye Clinic / Hospital", desc: "Medical eye care + optical sales" },
  { value: "BOTH", label: "Both", desc: "Clinic & retail combined" },
];

export default function RegisterPage() {
  const router = useRouter();

  // Read userId + name written by AuthForm Step 1
  const [userId, setUserId] = useState("");
  const [ownerName, setOwnerName] = useState("");

  useEffect(() => {
    const id = sessionStorage.getItem("reg_userId") || "";
    const name = sessionStorage.getItem("reg_name") || "";
    if (!id) {
      // No userId means they landed here directly — send them to register via login
      router.replace("/login");
      return;
    }
    setUserId(id);
    setOwnerName(name);
  }, [router]);

  // Form state
  const [shopName, setShopName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [shopType, setShopType] = useState("RETAIL_OPTICAL");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await completeShopSetup({ userId, shopName, city, phone, shopType });
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to set up shop.");
      return;
    }

    // Clean up sessionStorage
    sessionStorage.removeItem("reg_userId");
    sessionStorage.removeItem("reg_email");
    sessionStorage.removeItem("reg_name");

    setDone(true);
    // After 1.5s redirect to verify email prompt / login
    setTimeout(() => router.push("/login"), 1800);
  };

  // ─── Success state ───────────────────────────────────────────────────────
  if (done) {
    return (
      <main className={styles.page}>
        <div className={styles.glowTopLeft} aria-hidden="true" />
        <div className={styles.card}>
          <div className={styles.successState}>
            <CheckCircle2 size={52} color="#10b981" strokeWidth={1.5} />
            <h2 className={styles.successTitle}>Shop is ready!</h2>
            <p className={styles.successDesc}>
              {shopName} has been set up. Please verify your email to activate your account.
            </p>
            <div className={styles.successLoader} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.glowTopLeft} aria-hidden="true" />
      <div className={styles.glowBottomRight} aria-hidden="true" />

      <div className={styles.card}>
        {/* ─── Logo ──────────────────────────────────────────────────────── */}
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}>
            <Glasses size={22} strokeWidth={2} color="#d4af37" />
          </div>
          <span className={styles.logoText}>OptiPay</span>
        </div>

        {/* ─── Header ────────────────────────────────────────────────────── */}
        <div className={styles.heading}>
          <h1 className={styles.title}>
            {ownerName ? `Hi ${ownerName.split(" ")[0]} 👋` : "Set up your shop"}
          </h1>
          <p className={styles.subtitle}>
            Tell us about your store — you can update these details any time in Settings.
          </p>
        </div>

        {/* ─── Step Indicator ────────────────────────────────────────────── */}
        <div className={styles.stepIndicator}>
          <div className={styles.stepItem}>
            <div className={`${styles.stepDot} ${styles.stepDotDone}`}>
              <CheckCircle2 size={12} />
            </div>
            <span className={styles.stepLabelDone}>Account</span>
          </div>
          <div className={styles.stepLine} />
          <div className={styles.stepItem}>
            <div className={`${styles.stepDot} ${styles.stepDotActive}`}>2</div>
            <span className={styles.stepLabelActive}>Shop Setup</span>
          </div>
          <div className={styles.stepLine} />
          <div className={styles.stepItem}>
            <div className={`${styles.stepDot} ${styles.stepDotPending}`}>3</div>
            <span className={styles.stepLabelPending}>Verify Email</span>
          </div>
        </div>

        {/* ─── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* ─── Form ──────────────────────────────────────────────────────── */}
        <form className={styles.form} onSubmit={handleSubmit}>

          {/* Shop Name */}
          <div className={styles.field}>
            <label htmlFor="shop-name" className={styles.label}>Shop / Store name</label>
            <div className={styles.inputWrap}>
              <Store size={15} className={styles.inputIcon} />
              <input
                id="shop-name"
                type="text"
                required
                placeholder="Vision Plus Optics"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* City */}
          <div className={styles.field}>
            <label htmlFor="shop-city" className={styles.label}>City / Location</label>
            <div className={styles.inputWrap}>
              <MapPin size={15} className={styles.inputIcon} />
              <input
                id="shop-city"
                type="text"
                required
                placeholder="Mumbai, Maharashtra"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Phone */}
          <div className={styles.field}>
            <label htmlFor="shop-phone" className={styles.label}>Contact number</label>
            <div className={styles.inputWrap}>
              <Phone size={15} className={styles.inputIcon} />
              <input
                id="shop-phone"
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Shop Type */}
          <div className={styles.field}>
            <label className={styles.label}>Store type</label>
            <div className={styles.shopTypeGrid}>
              {SHOP_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`${styles.shopTypeCard} ${shopType === t.value ? styles.shopTypeCardActive : ""}`}
                  onClick={() => setShopType(t.value)}
                >
                  <Building2 size={16} className={styles.shopTypeIcon} />
                  <span className={styles.shopTypeLabel}>{t.label}</span>
                  <span className={styles.shopTypeDesc}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Setting up…" : (
              <>Launch My Shop <ChevronRight size={16} /></>
            )}
          </button>
        </form>

        <p className={styles.footerNote}>
          By continuing you agree to OptiPay's Terms of Service & Privacy Policy.
        </p>
      </div>
    </main>
  );
}
