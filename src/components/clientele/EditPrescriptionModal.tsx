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
    pdBinocular?: number | null; pdRight?: number | null; pdLeft?: number | null;
    segHeightRight?: number | null; segHeightLeft?: number | null;
    rightPrism?: number | null; rightBase?: string | null;
    leftPrism?: number | null; leftBase?: string | null;
    lensType?: string | null; lensIndex?: string | null;
    lensCoating?: string | null; opticianNotes?: string | null;
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
  const [rightSph, setRightSph] = useState(initialRx?.rightSph ?? 0.0);
  const [rightCyl, setRightCyl] = useState(initialRx?.rightCyl ?? 0.0);
  const [rightAxis, setRightAxis] = useState(initialRx?.rightAxis ?? 180);
  const [rightAdd, setRightAdd] = useState(initialRx?.rightAdd ?? 0.0);
  const [rightPrism, setRightPrism] = useState(initialRx?.rightPrism ?? 0.0);
  const [rightBase, setRightBase] = useState(initialRx?.rightBase ?? "In");

  const [leftSph, setLeftSph] = useState(initialRx?.leftSph ?? 0.0);
  const [leftCyl, setLeftCyl] = useState(initialRx?.leftCyl ?? 0.0);
  const [leftAxis, setLeftAxis] = useState(initialRx?.leftAxis ?? 180);
  const [leftAdd, setLeftAdd] = useState(initialRx?.leftAdd ?? 0.0);
  const [leftPrism, setLeftPrism] = useState(initialRx?.leftPrism ?? 0.0);
  const [leftBase, setLeftBase] = useState(initialRx?.leftBase ?? "In");

  const [pdBinocular, setPdBinocular] = useState(initialRx?.pdBinocular ?? 63.0);
  const [pdRight, setPdRight] = useState(initialRx?.pdRight ?? 31.5);
  const [pdLeft, setPdLeft] = useState(initialRx?.pdLeft ?? 31.5);
  const [segHeightRight, setSegHeightRight] = useState(initialRx?.segHeightRight ?? 18.0);
  const [segHeightLeft, setSegHeightLeft] = useState(initialRx?.segHeightLeft ?? 18.0);

  const [lensType, setLensType] = useState(initialRx?.lensType ?? "Single Vision");
  const [lensIndex, setLensIndex] = useState(initialRx?.lensIndex ?? "1.60 High-Index");
  const [lensCoating, setLensCoating] = useState(initialRx?.lensCoating ?? "Anti-Reflective AR + BlueProtect");
  const [opticianNotes, setOpticianNotes] = useState(initialRx?.opticianNotes ?? "");

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
      pdBinocular: Number(pdBinocular),
      pdRight: Number(pdRight),
      pdLeft: Number(pdLeft),
      segHeightRight: Number(segHeightRight),
      segHeightLeft: Number(segHeightLeft),
      rightPrism: Number(rightPrism),
      rightBase,
      leftPrism: Number(leftPrism),
      leftBase,
      lensType,
      lensIndex,
      lensCoating,
      opticianNotes,
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
          <div className={styles.eyeSection}>
            <div className={styles.eyeHeader}>
              <span className={styles.badgeOD}>OD</span>
              <span>RIGHT EYE PARAMETERS</span>
            </div>
            <div className={styles.grid4}>
              <div className={styles.field}>
                <label className={styles.label}>SPH (Refraction)</label>
                <input
                  type="number" step="0.25" value={rightSph}
                  onChange={(e) => setRightSph(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>CYL (Astigmatism)</label>
                <input
                  type="number" step="0.25" value={rightCyl}
                  onChange={(e) => setRightCyl(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>AXIS (0° - 180°)</label>
                <input
                  type="number" step="1" min="0" max="180" value={rightAxis}
                  onChange={(e) => setRightAxis(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>ADD (Near Vision)</label>
                <input
                  type="number" step="0.25" value={rightAdd}
                  onChange={(e) => setRightAdd(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.grid3} style={{ marginTop: "10px" }}>
              <div className={styles.field}>
                <label className={styles.label}>Seg Height (mm)</label>
                <input
                  type="number" step="0.5" value={segHeightRight}
                  onChange={(e) => setSegHeightRight(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Prism (Δ)</label>
                <input
                  type="number" step="0.25" value={rightPrism}
                  onChange={(e) => setRightPrism(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Base Direction</label>
                <select
                  value={rightBase}
                  onChange={(e) => setRightBase(e.target.value)}
                  className={styles.select}
                >
                  <option value="In">Base In (BI)</option>
                  <option value="Out">Base Out (BO)</option>
                  <option value="Up">Base Up (BU)</option>
                  <option value="Down">Base Down (BD)</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.eyeSection}>
            <div className={styles.eyeHeader}>
              <span className={styles.badgeOS}>OS</span>
              <span>LEFT EYE PARAMETERS</span>
            </div>
            <div className={styles.grid4}>
              <div className={styles.field}>
                <label className={styles.label}>SPH (Refraction)</label>
                <input
                  type="number" step="0.25" value={leftSph}
                  onChange={(e) => setLeftSph(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>CYL (Astigmatism)</label>
                <input
                  type="number" step="0.25" value={leftCyl}
                  onChange={(e) => setLeftCyl(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>AXIS (0° - 180°)</label>
                <input
                  type="number" step="1" min="0" max="180" value={leftAxis}
                  onChange={(e) => setLeftAxis(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>ADD (Near Vision)</label>
                <input
                  type="number" step="0.25" value={leftAdd}
                  onChange={(e) => setLeftAdd(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.grid3} style={{ marginTop: "10px" }}>
              <div className={styles.field}>
                <label className={styles.label}>Seg Height (mm)</label>
                <input
                  type="number" step="0.5" value={segHeightLeft}
                  onChange={(e) => setSegHeightLeft(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Prism (Δ)</label>
                <input
                  type="number" step="0.25" value={leftPrism}
                  onChange={(e) => setLeftPrism(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Base Direction</label>
                <select
                  value={leftBase}
                  onChange={(e) => setLeftBase(e.target.value)}
                  className={styles.select}
                >
                  <option value="In">Base In (BI)</option>
                  <option value="Out">Base Out (BO)</option>
                  <option value="Up">Base Up (BU)</option>
                  <option value="Down">Base Down (BD)</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.eyeSection}>
            <div className={styles.eyeHeader}>
              <span>PUPILLARY DISTANCE (PD) MEASUREMENTS</span>
            </div>
            <div className={styles.grid3}>
              <div className={styles.field}>
                <label className={styles.label}>Binocular Total PD (mm)</label>
                <input
                  type="number" step="0.5" value={pdBinocular}
                  onChange={(e) => setPdBinocular(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Monocular Right PD (mm)</label>
                <input
                  type="number" step="0.5" value={pdRight}
                  onChange={(e) => setPdRight(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Monocular Left PD (mm)</label>
                <input
                  type="number" step="0.5" value={pdLeft}
                  onChange={(e) => setPdLeft(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.eyeSection}>
            <div className={styles.eyeHeader}>
              <span>BESPOKE LENS & COATING BLUEPRINT</span>
            </div>
            <div className={styles.grid3}>
              <div className={styles.field}>
                <label className={styles.label}>Lens Type</label>
                <select
                  value={lensType}
                  onChange={(e) => setLensType(e.target.value)}
                  className={styles.select}
                >
                  <option value="Single Vision">Single Vision</option>
                  <option value="Progressive / Varifocal">Progressive / Varifocal</option>
                  <option value="Bifocal Executive">Bifocal Executive</option>
                  <option value="Workspace / Office Digital">Workspace / Office Digital</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Lens Index (Material)</label>
                <select
                  value={lensIndex}
                  onChange={(e) => setLensIndex(e.target.value)}
                  className={styles.select}
                >
                  <option value="1.50 Standard CR-39">1.50 Standard CR-39</option>
                  <option value="1.56 Mid-Index Thin">1.56 Mid-Index Thin</option>
                  <option value="1.60 High-Index Premium">1.60 High-Index Premium</option>
                  <option value="1.67 Polycarbonate Ultra-Light">1.67 Polycarbonate Ultra-Light</option>
                  <option value="1.74 High Index Ultra-Thin">1.74 High Index Ultra-Thin</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Coatings & Treatments</label>
                <select
                  value={lensCoating}
                  onChange={(e) => setLensCoating(e.target.value)}
                  className={styles.select}
                >
                  <option value="Anti-Reflective AR + BlueProtect">Anti-Reflective AR + BlueProtect</option>
                  <option value="Zeiss DuraVision AR">Zeiss DuraVision AR</option>
                  <option value="Transitions / Photochromic">Transitions / Photochromic (Adaptive)</option>
                  <option value="Hydrophobic Oleophobic Shield">Hydrophobic Oleophobic Shield</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Optician & Clinical Blueprint Notes</label>
            <textarea
              rows={2}
              value={opticianNotes}
              onChange={(e) => setOpticianNotes(e.target.value)}
              placeholder="e.g. Optimized for progressive corridor, fit with Zeiss digital verification."
              className={styles.input}
              style={{ width: "100%", height: "auto", minHeight: "56px" }}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? "Updating…" : "Save Vision Blueprint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
