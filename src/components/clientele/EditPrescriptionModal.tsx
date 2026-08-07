"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { updatePrescription } from "@/app/actions/clients";
import styles from "./EditPrescriptionModal.module.css";

interface Props {
  isOpen: boolean;
  clientId: string;
  initialRx?: {
    rightSph: number; rightCyl: number; rightAxis: number; rightAdd: number;
    leftSph: number; leftCyl: number; leftAxis: number; leftAdd: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPrescriptionModal({
  isOpen,
  clientId,
  initialRx,
  onClose,
  onSuccess,
}: Props) {
  const [rightSph, setRightSph] = useState(initialRx?.rightSph ?? -2.75);
  const [rightCyl, setRightCyl] = useState(initialRx?.rightCyl ?? -0.5);
  const [rightAxis, setRightAxis] = useState(initialRx?.rightAxis ?? 180);
  const [rightAdd, setRightAdd] = useState(initialRx?.rightAdd ?? 1.5);

  const [leftSph, setLeftSph] = useState(initialRx?.leftSph ?? -3.0);
  const [leftCyl, setLeftCyl] = useState(initialRx?.leftCyl ?? -0.75);
  const [leftAxis, setLeftAxis] = useState(initialRx?.leftAxis ?? 175);
  const [leftAdd, setLeftAdd] = useState(initialRx?.leftAdd ?? 1.5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await updatePrescription({
      clientId,
      rightSph: Number(rightSph),
      rightCyl: Number(rightCyl),
      rightAxis: Number(rightAxis),
      rightAdd: Number(rightAdd),
      leftSph: Number(leftSph),
      leftCyl: Number(leftCyl),
      leftAxis: Number(leftAxis),
      leftAdd: Number(leftAdd),
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to update prescription.");
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose} aria-modal="true" role="dialog">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Update Vision Blueprint</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Right Eye */}
          <div className={styles.eyeSection}>
            <div className={styles.eyeHeader}>
              <span className={styles.badgeOD}>OD</span>
              <span>RIGHT EYE PARAMETERS</span>
            </div>
            <div className={styles.grid4}>
              <div className={styles.field}>
                <label className={styles.label}>SPH</label>
                <input
                  type="number" step="0.25" value={rightSph}
                  onChange={(e) => setRightSph(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>CYL</label>
                <input
                  type="number" step="0.25" value={rightCyl}
                  onChange={(e) => setRightCyl(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>AXIS</label>
                <input
                  type="number" step="1" value={rightAxis}
                  onChange={(e) => setRightAxis(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>ADD</label>
                <input
                  type="number" step="0.25" value={rightAdd}
                  onChange={(e) => setRightAdd(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Left Eye */}
          <div className={styles.eyeSection}>
            <div className={styles.eyeHeader}>
              <span className={styles.badgeOS}>OS</span>
              <span>LEFT EYE PARAMETERS</span>
            </div>
            <div className={styles.grid4}>
              <div className={styles.field}>
                <label className={styles.label}>SPH</label>
                <input
                  type="number" step="0.25" value={leftSph}
                  onChange={(e) => setLeftSph(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>CYL</label>
                <input
                  type="number" step="0.25" value={leftCyl}
                  onChange={(e) => setLeftCyl(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>AXIS</label>
                <input
                  type="number" step="1" value={leftAxis}
                  onChange={(e) => setLeftAxis(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>ADD</label>
                <input
                  type="number" step="0.25" value={leftAdd}
                  onChange={(e) => setLeftAdd(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? "Updating…" : "Save Blueprint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
