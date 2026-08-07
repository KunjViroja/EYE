"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/app/actions/clients";
import { MemberTier } from "@prisma/client";
import styles from "./NewClientModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewClientModal({ isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("Los Angeles, CA");
  const [tier, setTier] = useState<MemberTier>(MemberTier.ELITE_ATELIER_MEMBER);
  const [stylePreference, setStylePreference] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await createClient({
      name,
      email,
      phone,
      location,
      tier,
      stylePreference,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to create client.");
      return;
    }

    setName("");
    setEmail("");
    setPhone("");
    setStylePreference("");
    onSuccess();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose} aria-modal="true" role="dialog">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Register Atelier Client</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="client-name">Full Name</label>
            <input
              id="client-name"
              type="text"
              required
              placeholder="e.g. Sofia Jensen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="client-email">Email Address</label>
              <input
                id="client-email"
                type="email"
                required
                placeholder="sofia@luxury.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="client-phone">Phone Number</label>
              <input
                id="client-phone"
                type="text"
                required
                placeholder="+1 (555) 012-3456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="client-loc">Location</label>
              <input
                id="client-loc"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="client-tier">Membership Tier</label>
              <select
                id="client-tier"
                value={tier}
                onChange={(e) => setTier(e.target.value as MemberTier)}
                className={styles.select}
              >
                <option value={MemberTier.ELITE_ATELIER_MEMBER}>Elite Member</option>
                <option value={MemberTier.PREMIUM_CLIENT}>Premium Client</option>
                <option value={MemberTier.ATELIER_MEMBER}>Atelier Member</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="client-pref">Stylist Curations & Style Preference</label>
            <textarea
              id="client-pref"
              placeholder="e.g. Prefers oversized acetate frames in tortoiseshell…"
              value={stylePreference}
              onChange={(e) => setStylePreference(e.target.value)}
              className={styles.textarea}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? "Registering…" : "Register Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
