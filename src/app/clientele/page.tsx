import type { Metadata } from "next";
import { mockClients } from "@/lib/mockData";
import shellStyles from "@/components/layout/AppShell.module.css";
import styles from "./ClientelePage.module.css";
import { Phone, Mail, MapPin, ArrowLeft, Download } from "lucide-react";
import EyewearSilhouette from "@/components/ui/EyewearSilhouette";

export const metadata: Metadata = { title: "Clientele" };

// For now show the first client in detail — Phase 2: proper routing with /clientele/[id]
const client = mockClients[0];

export default function ClientelePage() {
  return (
    <div>
      <div className={shellStyles.pageHeader}>
        <div className={shellStyles.pageHeaderLeft}>
          <div className={styles.breadcrumb}>
            <ArrowLeft size={14} />
            <span>Client Portfolio</span>
          </div>
        </div>
        <div className={shellStyles.pageHeaderRight}>
          <button type="button" className={styles.contactBtn}>
            <Mail size={15} />
            Contact Client
          </button>
          <button type="button" className={styles.sessionBtn}>
            New Style Session
          </button>
        </div>
      </div>

      <div className={shellStyles.pageBody}>
        <div className={styles.layout}>
          {/* Left — Client profile */}
          <div className={styles.left}>
            {/* Profile card */}
            <div className={styles.profileCard}>
              <div className={styles.profileImageWrap}>
                <div className={styles.profileImage}>SJ</div>
              </div>
              <div className={styles.profileName}>{client.name}</div>
              <div className={styles.profileTier}>{client.tier}</div>

              <div className={styles.profileStats}>
                <div className={styles.profileStat}>
                  <span className={styles.profileStatValue}>${client.totalSpent.toLocaleString()}.00</span>
                  <span className={styles.profileStatLabel}>Total Spent</span>
                </div>
                <div className={styles.profileStatDivider} />
                <div className={styles.profileStat}>
                  <span className={styles.profileStatValue}>{client.itemsOwned} Pieces</span>
                  <span className={styles.profileStatLabel}>Items Owned</span>
                </div>
              </div>

              <div className={styles.contactInfo}>
                <div className={styles.contactRow}>
                  <Phone size={13} />
                  <span>{client.phone}</span>
                </div>
                <div className={styles.contactRow}>
                  <Mail size={13} />
                  <span>{client.email}</span>
                </div>
                <div className={styles.contactRow}>
                  <MapPin size={13} />
                  <span>{client.location}</span>
                </div>
              </div>
            </div>

            {/* Stylist Curations */}
            <div className={styles.curationsCard}>
              <div className={styles.curationsLabel}>STYLIST CURATIONS</div>
              <div className={styles.curationItem}>
                <div className={styles.curationTitle}>Style Preference</div>
                <p className={styles.curationText}>{client.stylePreference}</p>
              </div>
              <div className={styles.curationItem}>
                <div className={`${styles.curationTitle} ${styles.curationTitleGold}`}>Prescription Milestone</div>
                <p className={styles.curationText}>{client.prescriptionMilestone}</p>
              </div>
            </div>
          </div>

          {/* Right — Prescription + Acquisitions */}
          <div className={styles.right}>
            {/* Vision Blueprint */}
            <div className={styles.visionCard}>
              <div className={styles.visionHeader}>
                <div>
                  <h2 className={styles.visionTitle}>Vision Blueprint</h2>
                  <p className={styles.visionDate}>Verified {client.prescription.lastVerified}</p>
                </div>
                <button type="button" className={styles.downloadBtn}>
                  <Download size={14} />
                  DOWNLOAD PDF
                </button>
              </div>

              <div className={styles.rxGrid}>
                {/* Right Eye */}
                <div className={styles.rxCard}>
                  <div className={styles.rxEyeLabel}>
                    <span className={`${styles.rxEyeBadge} ${styles.rxEyeOD}`}>OD</span>
                    RIGHT EYE
                  </div>
                  <div className={styles.rxValues}>
                    {Object.entries(client.prescription.rightEye).map(([key, val]) => (
                      <div key={key} className={styles.rxValue}>
                        <div className={styles.rxNum}>{val > 0 ? `+${val}` : val}</div>
                        <div className={styles.rxKey}>{key.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Left Eye */}
                <div className={styles.rxCard}>
                  <div className={styles.rxEyeLabel}>
                    <span className={`${styles.rxEyeBadge} ${styles.rxEyeOS}`}>OS</span>
                    LEFT EYE
                  </div>
                  <div className={styles.rxValues}>
                    {Object.entries(client.prescription.leftEye).map(([key, val]) => (
                      <div key={key} className={styles.rxValue}>
                        <div className={styles.rxNum}>{val > 0 ? `+${val}` : val}</div>
                        <div className={styles.rxKey}>{key.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Atelier Acquisitions */}
            <div className={styles.acquisitionsCard}>
              <div className={styles.acquisitionsHeader}>
                <h3 className={styles.acquisitionsTitle}>Atelier Acquisitions</h3>
                <span className={styles.fullLedger}>FULL LEDGER</span>
              </div>
              <div className={styles.acquisitionsList}>
                {client.acquisitions.map((acq) => (
                  <div key={acq.id} className={styles.acquisitionRow}>
                    <div className={styles.acqImg}>
                      <EyewearSilhouette color="#C9A96E" size={36} />
                    </div>
                    <div className={styles.acqInfo}>
                      <div className={styles.acqProduct}>{acq.product}</div>
                      <div className={styles.acqDesc}>{acq.description}</div>
                      <div className={styles.acqMeta}>
                        {acq.date}
                        <span className={styles.acqDot}>•</span>
                        <span className={`${styles.acqStatus} ${acq.status === "DELIVERED" ? styles.acqStatusDelivered : styles.acqStatusProcessing}`}>
                          {acq.status}
                        </span>
                      </div>
                    </div>
                    <div className={styles.acqAmount}>${acq.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
