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
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Unspecified");
  const [location, setLocation] = useState("");
  const [tier, setTier] = useState<MemberTier>(MemberTier.ELITE_EYE_MEMBER);
  const [stylePreference, setStylePreference] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");

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
      secondaryPhone,
      dob,
      gender,
      location,
      tier,
      stylePreference,
      medicalNotes,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to create client.");
      return;
    }

    setName("");
    setEmail("");
    setPhone("");
    setSecondaryPhone("");
    setDob("");
    setGender("Unspecified");
    setLocation("");
    setStylePreference("");
    setMedicalNotes("");
    onSuccess();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose} aria-modal="true" role="dialog">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Register EYE Client Profile</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="client-name">Full Name *</label>
            <input
              id="client-name"
              type="text"
              required
              placeholder="e.g. Alexander Wright"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="client-email">Email Address *</label>
              <input
                id="client-email"
                type="email"
                required
                placeholder="e.g. alexander@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="client-phone">Primary Phone *</label>
              <input
                id="client-phone"
                type="text"
                required
                placeholder="+1 (555) 019-2834"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="client-sec-phone">Secondary Phone</label>
              <input
                id="client-sec-phone"
                type="text"
                placeholder="+1 (555) 987-6543"
                value={secondaryPhone}
                onChange={(e) => setSecondaryPhone(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="client-dob">Date of Birth</label>
              <input
                id="client-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="client-gender">Gender</label>
              <select
                id="client-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={styles.select}
              >
                <option value="Unspecified">Unspecified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="client-loc">Location / Address</label>
              <input
                id="client-loc"
                type="text"
                placeholder="e.g. 742 Evergreen Terrace, Springfield"
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
                <option value={MemberTier.ELITE_EYE_MEMBER}>Elite EYE Member</option>
                <option value={MemberTier.PREMIUM_MEMBER}>Premium Member</option>
                <option value={MemberTier.STANDARD_MEMBER}>Standard Member</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="client-pref">Stylist Curations & Style Preference</label>
            <textarea
              id="client-pref"
              placeholder="e.g. Prefers oversized acetate frames in tortoiseshell, titanium nose pads…"
              value={stylePreference}
              onChange={(e) => setStylePreference(e.target.value)}
              className={styles.textarea}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="client-med">Eye Health & Medical Notes</label>
            <textarea
              id="client-med"
              placeholder="e.g. Sensitive to glare, prefers anti-reflective Zeiss blue light protection, dry eye history."
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              className={styles.textarea}
              style={{ minHeight: "56px" }}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? "Registering…" : "Register Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
