"use client";

import { useState, useEffect, useCallback } from "react";
import { getClients } from "@/app/actions/clients";
import shellStyles from "@/components/layout/AppShell.module.css";
import styles from "./ClientelePage.module.css";
import { Phone, Mail, MapPin, Download, Plus, Edit3, UserPlus, RefreshCw, Receipt, FileText } from "lucide-react";
import EyewearSilhouette from "@/components/ui/EyewearSilhouette";
import NewClientModal from "@/components/clientele/NewClientModal";
import EditPrescriptionModal from "@/components/clientele/EditPrescriptionModal";
import ThermalReceiptModal, { ReceiptData } from "@/components/pos/ThermalReceiptModal";
import { saasConfig } from "@/config/saasConfig";

export default function ClientelePage() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientIndex, setSelectedClientIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  const loadLiveClients = useCallback(async () => {
    setLoading(true);
    const res = await getClients();
    if (res.success && res.data) {
      setClients(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLiveClients();
  }, [loadLiveClients]);

  const client = clients[selectedClientIndex] || clients[0];
  const activeRx = client?.prescriptions?.[0];

  // ✅ ACCURATE ATOMIC CALCULATION: Sum total units/quantities across all sales
  const totalPiecesOwned =
    client?.sales?.reduce(
      (total: number, sale: any) =>
        total +
        (sale.items?.reduce(
          (itemSum: number, item: any) => itemSum + (item.quantity || 1),
          0
        ) || 0),
      0
    ) || 0;
  const handleOpenReceipt = (sale: any) => {
    const now = new Date(sale.createdAt);
    const formattedDate = now.toLocaleDateString("en-GB");
    const formattedTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    const items = sale.items?.map((it: any) => ({
      name: it.product?.name || "Eyewear",
      brand: it.product?.brand || "OPTICAL",
      quantity: it.quantity || 1,
      unitPrice: it.unitPrice || (sale.grandTotal / (it.quantity || 1)),
      hasPrescription: it.hasPrescription || false,
    })) || [];

    const subtotal = sale.subtotal || sale.grandTotal;
    const discount = sale.discount || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const totalTax = Math.max(0, sale.grandTotal - taxableAmount);
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;

    setSelectedReceipt({
      orderId: sale.id,
      date: formattedDate,
      time: formattedTime,
      clientName: client.name,
      clientPhone: client.phone,
      clientLocation: client.location,
      billType: "12% GST(L)",
      paymentMethod: sale.paymentMethod ? String(sale.paymentMethod).replace(/_/g, " ") : "Cash",
      items,
      subtotal,
      discount,
      taxableAmount,
      cgst,
      sgst,
      igst: 0,
      totalTax,
      grandTotal: sale.grandTotal,
      advancePaid: sale.advancePaid || sale.grandTotal,
      remainingBalance: sale.remainingBalance || 0,
      isAdvance: (sale.remainingBalance || 0) > 0,
      rxData: activeRx ? {
        rightSph: activeRx.rightSph,
        rightCyl: activeRx.rightCyl,
        rightAxis: activeRx.rightAxis,
        rightAdd: activeRx.rightAdd,
        leftSph: activeRx.leftSph,
        leftCyl: activeRx.leftCyl,
        leftAxis: activeRx.leftAxis,
        leftAdd: activeRx.leftAdd,
        pdBinocular: activeRx.pdBinocular,
        doctorName: activeRx.doctorName || "Dr. A. Sharma",
      } : undefined,
    });
  };

  return (
    <div>
      {/* Page Header */}
      <div className={shellStyles.pageHeader}>
        <div className={shellStyles.pageHeaderLeft}>
          <h1 className={shellStyles.pageTitle}>Client Portfolio</h1>
          <p className={shellStyles.pageSubtitle}>
            Manage client profiles, vision blueprints, and acquisition history in real-time.
          </p>
        </div>
        <div className={shellStyles.pageHeaderRight}>
          <button
            type="button"
            className={styles.contactBtn}
            onClick={() => setIsClientModalOpen(true)}
          >
            <UserPlus size={15} />
            New Client
          </button>
          <button
            type="button"
            className={styles.sessionBtn}
            onClick={() => setIsRxModalOpen(true)}
            disabled={!client}
          >
            <Edit3 size={15} />
            Edit Vision Blueprint
          </button>
        </div>
      </div>

      <div className={shellStyles.pageBody}>
        {loading ? (
          <div className={styles.loadingState}>
            <RefreshCw size={24} className={styles.spin} />
            <span>Loading client records…</span>
          </div>
        ) : !client ? (
          <div className={styles.emptyState}>
            <p>No client records found.</p>
            <button type="button" className={styles.sessionBtn} onClick={() => setIsClientModalOpen(true)}>
              + Register First Client
            </button>
          </div>
        ) : (
          <div className={styles.layout}>
            {/* Left — Client Profile & Selector */}
            <div className={styles.left}>
              {/* Client Selector Dropdown if multiple */}
              {clients.length > 1 && (
                <div className={styles.clientSelectWrap}>
                  <label className={styles.selectLabel} htmlFor="client-selector">SELECT CLIENT PROFILE</label>
                  <select
                    id="client-selector"
                    className={styles.clientSelect}
                    value={selectedClientIndex}
                    onChange={(e) => setSelectedClientIndex(Number(e.target.value))}
                  >
                    {clients.map((c, i) => (
                      <option key={c.id} value={i}>
                        {c.name} ({c.tier.replace(/_/g, " ")}) — {c.phone || c.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Profile Card */}
              <div className={styles.profileCard}>
                <div className={styles.profileImageWrap}>
                  <div className={styles.profileImage}>
                    {client.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                  </div>
                </div>
                <div className={styles.profileName}>{client.name}</div>
                <div className={styles.profileTier}>{client.tier.replace(/_/g, " ")}</div>

                <div className={styles.profileStats}>
                  <div className={styles.profileStat}>
                    <span className={styles.profileStatValue}>
                      {saasConfig.currency}{(client.totalSpent || 0).toLocaleString("en-IN")}
                    </span>
                    <span className={styles.profileStatLabel}>Total Billed</span>
                  </div>
                  <div className={styles.profileStatDivider} />
                  <div className={styles.profileStat}>
                    <span className={styles.profileStatValue}>
                      {totalPiecesOwned} {totalPiecesOwned === 1 ? "Unit" : "Units"}
                    </span>
                    <span className={styles.profileStatLabel}>Items Owned</span>
                  </div>
                </div>

                <div className={styles.contactInfo}>
                  <div className={styles.contactRow}>
                    <Phone size={13} />
                    <span>{client.phone || "No phone provided"}</span>
                  </div>
                  <div className={styles.contactRow}>
                    <Mail size={13} />
                    <span>{client.email}</span>
                  </div>
                  <div className={styles.contactRow}>
                    <MapPin size={13} />
                    <span>{client.location || "Location not provided"}</span>
                  </div>
                </div>
              </div>

              {/* Stylist Curations & Medical Notes */}
              <div className={styles.curationsCard}>
                <div className={styles.curationsLabel}>STYLIST CURATIONS & EYE HEALTH</div>
                <div className={styles.curationItem}>
                  <div className={styles.curationTitle}>Style Preference</div>
                  <p className={styles.curationText}>{client.stylePreference || "Classic luxury acetate frames."}</p>
                </div>
                {client.medicalNotes && (
                  <div className={styles.curationItem}>
                    <div className={styles.curationTitle}>Medical Notes</div>
                    <p className={styles.curationText}>{client.medicalNotes}</p>
                  </div>
                )}
                <div className={styles.curationItem}>
                  <div className={`${styles.curationTitle} ${styles.curationTitleGold}`}>Prescription Milestone</div>
                  <p className={styles.curationText}>{client.prescriptionMilestone || "Initial blueprint active."}</p>
                </div>
              </div>
            </div>

            {/* Right — Vision Blueprint + Acquisitions */}
            <div className={styles.right}>
              {/* Vision Blueprint */}
              <div className={styles.visionCard}>
                <div className={styles.visionHeader}>
                  <div>
                    <h2 className={styles.visionTitle}>Vision Blueprint</h2>
                    <p className={styles.visionDate}>
                      Verified {activeRx ? new Date(activeRx.lastVerified).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Active Profile"} • Dr. A. Sharma
                    </p>
                  </div>
                  <button type="button" className={styles.downloadBtn} onClick={() => window.print()} title="Print Vision Blueprint">
                    <Download size={14} />
                    <span>PRINT BLUEPRINT</span>
                  </button>
                </div>

                <div className={styles.rxGrid}>
                  {/* OD — Right Eye */}
                  <div className={styles.rxCard}>
                    <div className={styles.rxEyeLabel}>
                      <span className={`${styles.rxEyeBadge} ${styles.rxEyeOD}`}>OD</span>
                      RIGHT EYE
                    </div>
                    <div className={styles.rxValues}>
                      <div className={styles.rxValue}>
                        <div className={styles.rxNum}>{activeRx ? (activeRx.rightSph >= 0 ? `+${activeRx.rightSph.toFixed(2)}` : activeRx.rightSph.toFixed(2)) : "+0.00"}</div>
                        <div className={styles.rxKey}>SPH</div>
                      </div>
                      <div className={styles.rxValue}>
                        <div className={styles.rxNum}>{activeRx ? (activeRx.rightCyl >= 0 ? `+${activeRx.rightCyl.toFixed(2)}` : activeRx.rightCyl.toFixed(2)) : "+0.00"}</div>
                        <div className={styles.rxKey}>CYL</div>
                      </div>
                      <div className={styles.rxValue}>
                        <div className={styles.rxNum}>{activeRx?.rightAxis ?? 180}°</div>
                        <div className={styles.rxKey}>AXIS</div>
                      </div>
                      <div className={styles.rxValue}>
                        <div className={styles.rxNum}>{activeRx ? `+${activeRx.rightAdd.toFixed(2)}` : "+0.00"}</div>
                        <div className={styles.rxKey}>ADD</div>
                      </div>
                    </div>
                  </div>

                  {/* OS — Left Eye */}
                  <div className={styles.rxCard}>
                    <div className={styles.rxEyeLabel}>
                      <span className={`${styles.rxEyeBadge} ${styles.rxEyeOS}`}>OS</span>
                      LEFT EYE
                    </div>
                    <div className={styles.rxValues}>
                      <div className={styles.rxValue}>
                        <div className={styles.rxNum}>{activeRx ? (activeRx.leftSph >= 0 ? `+${activeRx.leftSph.toFixed(2)}` : activeRx.leftSph.toFixed(2)) : "+0.00"}</div>
                        <div className={styles.rxKey}>SPH</div>
                      </div>
                      <div className={styles.rxValue}>
                        <div className={styles.rxNum}>{activeRx ? (activeRx.leftCyl >= 0 ? `+${activeRx.leftCyl.toFixed(2)}` : activeRx.leftCyl.toFixed(2)) : "+0.00"}</div>
                        <div className={styles.rxKey}>CYL</div>
                      </div>
                      <div className={styles.rxValue}>
                        <div className={styles.rxNum}>{activeRx?.leftAxis ?? 180}°</div>
                        <div className={styles.rxKey}>AXIS</div>
                      </div>
                      <div className={styles.rxValue}>
                        <div className={styles.rxNum}>{activeRx ? `+${activeRx.leftAdd.toFixed(2)}` : "+0.00"}</div>
                        <div className={styles.rxKey}>ADD</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Rx Specs */}
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", fontSize: "12px" }}>
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.5)", display: "block", fontSize: "10px", fontWeight: "bold" }}>PUPILLARY DISTANCE (PD)</span>
                    <span style={{ color: "#fff", fontWeight: "600" }}>{activeRx?.pdBinocular ? `${activeRx.pdBinocular} mm` : "63.0 mm (Binocular)"}</span>
                  </div>
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.5)", display: "block", fontSize: "10px", fontWeight: "bold" }}>LENS TYPE & INDEX</span>
                    <span style={{ color: "#fff", fontWeight: "600" }}>{activeRx?.lensType || "Single Vision"} • {activeRx?.lensIndex || "1.60 High-Index"}</span>
                  </div>
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.5)", display: "block", fontSize: "10px", fontWeight: "bold" }}>COATINGS & TREATMENT</span>
                    <span style={{ color: "var(--color-gold)", fontWeight: "600" }}>{activeRx?.lensCoating || "Anti-Reflective AR + BlueProtect"}</span>
                  </div>
                </div>
              </div>

              {/* EYE Acquisitions & Invoices */}
              <div className={styles.acquisitionsCard}>
                <div className={styles.acquisitionsHeader}>
                  <h3 className={styles.acquisitionsTitle}>Acquisitions & Invoices</h3>
                  <span className={styles.fullLedger}>
                    <FileText size={12} /> {client.sales?.length || 0} Invoices
                  </span>
                </div>
                <div className={styles.acquisitionsList}>
                  {(!client.sales || client.sales.length === 0) ? (
                    <div className={styles.emptyAcquisitions}>No purchases recorded yet for this client.</div>
                  ) : (
                    client.sales.map((sale: any) => {
                      const totalUnitsInSale =
                        sale.items?.reduce(
                          (sum: number, it: any) => sum + (it.quantity || 1),
                          0
                        ) || 1;

                      return (
                        <div key={sale.id} className={styles.acquisitionRow}>
                          <div className={styles.acqImg}>
                            <EyewearSilhouette color="#C9A96E" size={36} />
                          </div>
                          <div className={styles.acqInfo}>
                            <div className={styles.acqProduct}>
                              {sale.items[0]?.product?.name || "Bespoke Eyewear Creation"}
                            </div>
                            <div className={styles.acqDesc}>
                              {sale.items[0]?.product?.brand || "OPTICAL"} • {totalUnitsInSale} Unit{totalUnitsInSale === 1 ? "" : "s"}
                            </div>
                            <div className={styles.acqMeta}>
                              {new Date(sale.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              <span className={styles.acqDot}>•</span>
                              <span className={`${styles.acqStatus} ${sale.status === "COMPLETED" ? styles.acqStatusDelivered : styles.acqStatusProcessing}`}>
                                {sale.status}
                              </span>
                            </div>
                          </div>
                          <div className={styles.acqRight}>
                            <div className={styles.acqAmount}>{saasConfig.currency}{sale.grandTotal.toFixed(2)}</div>
                            <button
                              type="button"
                              className={styles.viewInvoiceBtn}
                              onClick={() => handleOpenReceipt(sale)}
                              title="View or Print Tax Invoice"
                            >
                              <Receipt size={12} /> View Bill
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={loadLiveClients}
      />

      {client && (
        <EditPrescriptionModal
          isOpen={isRxModalOpen}
          clientId={client.id}
          initialRx={activeRx}
          onClose={() => setIsRxModalOpen(false)}
          onSuccess={loadLiveClients}
        />
      )}

      {/* Printable Thermal Receipt / Tax Invoice Modal */}
      <ThermalReceiptModal
        data={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}
