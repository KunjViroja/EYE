"use client";

import { useState } from "react";
import { X, UserPlus, Eye, Calendar, UserCheck } from "lucide-react";
import { createClient, updatePrescription } from "@/app/actions/clients";
import styles from "./BillingNewClientModal.module.css";
import { saasConfig } from "@/config/saasConfig";

interface BillingNewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newClient: {
    id: string;
    name: string;
    tier: string;
    phone?: string;
    email?: string;
    location?: string;
    doctorName?: string;
    visitDate?: string;
    latestPrescription?: any;
  }) => void;
}

export default function BillingNewClientModal({
  isOpen,
  onClose,
  onSuccess,
}: BillingNewClientModalProps) {
  // Client Info State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Doctor & Visit Metadata (Referred By & Date of Visit)
  const [doctorName, setDoctorName] = useState("Dr. A. Sharma (Optometrist)");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]);
  const [lensFor, setLensFor] = useState<"Ready" | "Rx">("Rx");

  // Prescription Rx State
  const [rightSph, setRightSph] = useState<string>("0.00");
  const [rightCyl, setRightCyl] = useState<string>("0.00");
  const [rightAxis, setRightAxis] = useState<string>("180");
  const [rightAdd, setRightAdd] = useState<string>("0.00");
  const [rightVision, setRightVision] = useState<string>("6/6");

  const [leftSph, setLeftSph] = useState<string>("0.00");
  const [leftCyl, setLeftCyl] = useState<string>("0.00");
  const [leftAxis, setLeftAxis] = useState<string>("180");
  const [leftAdd, setLeftAdd] = useState<string>("0.00");
  const [leftVision, setLeftVision] = useState<string>("6/6");

  const [pdBinocular, setPdBinocular] = useState<string>("63.0");
  const [opticianNotes, setOpticianNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const formatNearSphere = (sph: string, add: string) => {
    const sphNum = Number(sph);
    const addNum = Number(add);
    if (!Number.isFinite(sphNum) || !Number.isFinite(addNum)) {
      return "—";
    }

    const nearValue = sphNum + addNum;
    return `${nearValue >= 0 ? "+" : ""}${nearValue.toFixed(2)}`;
  };

  const rightNearSphere = formatNearSphere(rightSph, rightAdd);
  const leftNearSphere = formatNearSphere(leftSph, leftAdd);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !phone) {
      setError("Customer Name and Phone Number are required.");
      return;
    }

    setLoading(true);

    const clientRes = await createClient({
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, ".")}@boutique.local`,
      phone,
      location: "Walk-in Store Customer",
      medicalNotes: notes || undefined,
    });

    if (!clientRes.success || !clientRes.data) {
      setLoading(false);
      setError(clientRes.error || "Failed to register new client.");
      return;
    }

    const createdClient = clientRes.data;

    // Record Prescription Blueprint
    const rxRes = await updatePrescription({
      clientId: createdClient.id,
      doctorName,
      visitDate,
      rightSph: Number(rightSph) || 0,
      rightCyl: Number(rightCyl) || 0,
      rightAxis: Number(rightAxis) || 180,
      rightAdd: Number(rightAdd) || 0,
      rightVision,
      leftSph: Number(leftSph) || 0,
      leftCyl: Number(leftCyl) || 0,
      leftAxis: Number(leftAxis) || 180,
      leftAdd: Number(leftAdd) || 0,
      leftVision,
      pdBinocular: Number(pdBinocular) || 63,
      lensFor,
      opticianNotes,
    });

    setLoading(false);

    onSuccess({
      id: createdClient.id,
      name: createdClient.name,
      tier: "ELITE EYE MEMBER",
      phone: createdClient.phone || phone,
      email: createdClient.email || email,
      location: createdClient.location || "Local Walk-in",
      doctorName,
      visitDate,
      latestPrescription: rxRes.data ? {
        doctorName,
        visitDate,
        rightSph: Number(rightSph),
        rightCyl: Number(rightCyl),
        rightAxis: Number(rightAxis),
        rightAdd: Number(rightAdd),
        rightVision,
        leftSph: Number(leftSph),
        leftCyl: Number(leftCyl),
        leftAxis: Number(leftAxis),
        leftAdd: Number(leftAdd),
        leftVision,
        pdBinocular: Number(pdBinocular),
        lensFor,
        deliveryDate,
      } : undefined,
    });

    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <UserPlus size={18} color="#d4af37" /> New Customer & Vision Prescription Entry
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* 1. Client Basic Details */}
          <div className={styles.sectionTitle}>1. Customer Profile</div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Customer Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Marcus Thorne"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                className={styles.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Doctor Name (RefBy) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. A. Sharma"
                className={styles.input}
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Referred Date / Visit Date *</label>
              <input
                type="date"
                required
                className={styles.input}
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>
          </div>

          {/* 2. Optical Vision Prescription Form */}
          <div className={styles.sectionTitle}>
            <Eye size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />
            2. Optical Prescription (OD & OS)
          </div>

          <div className={styles.rxTableWrapper}>
            <table className={styles.rxTable}>
              <thead>
                <tr>
                  <th>Eye</th>
                  <th>PWR / SPH</th>
                  <th>CYL</th>
                  <th>AXIS (°)</th>
                  <th>V/N (Vision)</th>
                  <th>Add Power</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.eyeLabel}>Right (OD)</td>
                  <td>
                    <input
                      type="text"
                      className={styles.rxInput}
                      value={rightSph}
                      onFocus={handleFocus}
                      onChange={(e) => setRightSph(e.target.value)}
                      placeholder="-1.25"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.rxInput}
                      value={rightCyl}
                      onFocus={handleFocus}
                      onChange={(e) => setRightCyl(e.target.value)}
                      placeholder="-0.50"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.rxInput}
                      value={rightAxis}
                      onFocus={handleFocus}
                      onChange={(e) => setRightAxis(e.target.value)}
                      placeholder="180"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.rxInput}
                      value={rightVision}
                      onChange={(e) => setRightVision(e.target.value)}
                      placeholder="6/6"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.rxInput}
                      value={rightAdd}
                      onFocus={handleFocus}
                      onChange={(e) => setRightAdd(e.target.value)}
                      placeholder="+1.75"
                    />
                  </td>
                </tr>
                <tr>
                  <td className={styles.eyeLabel}>Left (OS)</td>
                  <td>
                    <input
                      type="text"
                      className={styles.rxInput}
                      value={leftSph}
                      onFocus={handleFocus}
                      onChange={(e) => setLeftSph(e.target.value)}
                      placeholder="-1.50"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.rxInput}
                      value={leftCyl}
                      onFocus={handleFocus}
                      onChange={(e) => setLeftCyl(e.target.value)}
                      placeholder="-0.75"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.rxInput}
                      value={leftAxis}
                      onFocus={handleFocus}
                      onChange={(e) => setLeftAxis(e.target.value)}
                      placeholder="90"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.rxInput}
                      value={leftVision}
                      onChange={(e) => setLeftVision(e.target.value)}
                      placeholder="6/6"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.rxInput}
                      value={leftAdd}
                      onFocus={handleFocus}
                      onChange={(e) => setLeftAdd(e.target.value)}
                      placeholder="+1.75"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>P.D. (Pupillary Distance mm)</label>
              <input
                type="text"
                className={styles.input}
                value={pdBinocular}
                onChange={(e) => setPdBinocular(e.target.value)}
                placeholder="63.0"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Lens For</label>
              <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                <button
                  type="button"
                  onClick={() => setLensFor("Ready")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "6px",
                    border: lensFor === "Ready" ? "1px solid #34d399" : "1px solid rgba(255,255,255,0.1)",
                    background: lensFor === "Ready" ? "rgba(52, 211, 153, 0.2)" : "rgba(2, 6, 23, 0.5)",
                    color: lensFor === "Ready" ? "#34d399" : "#94a3b8",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  Ready Lens
                </button>
                <button
                  type="button"
                  onClick={() => setLensFor("Rx")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "6px",
                    border: lensFor === "Rx" ? "1px solid #d4af37" : "1px solid rgba(255,255,255,0.1)",
                    background: lensFor === "Rx" ? "rgba(212, 175, 55, 0.2)" : "rgba(2, 6, 23, 0.5)",
                    color: lensFor === "Rx" ? "#d4af37" : "#94a3b8",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  Custom Rx
                </button>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? "Registering…" : "Save Customer & Vision Blueprint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
