"use client";

import { Printer, X, Receipt, CheckCircle } from "lucide-react";
import styles from "./ThermalReceiptModal.module.css";
import { saasConfig } from "@/config/saasConfig";

export interface ReceiptData {
  orderId: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone?: string;
  clientLocation?: string;
  billType: string;
  paymentMethod: string;
  items: Array<{
    name: string;
    brand: string;
    quantity: number;
    unitPrice: number;
    hasPrescription?: boolean;
  }>;
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
  advancePaid: number;
  remainingBalance: number;
  isAdvance: boolean;
  rxData?: {
    rightSph: number;
    rightCyl: number;
    rightAxis: number;
    rightAdd: number;
    leftSph: number;
    leftCyl: number;
    leftAxis: number;
    leftAdd: number;
    pdBinocular?: number | null;
    doctorName?: string;
    deliveryDate?: string | null;
  };
}

interface Props {
  data: ReceiptData | null;
  onClose: () => void;
}

export default function ThermalReceiptModal({ data, onClose }: Props) {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modalContainer}>
        {/* Modal Action Bar */}
        <div className={styles.actionBar}>
          <div className={styles.actionTitle}>
            <Receipt size={18} />
            <span>Order #{data.orderId} Created</span>
          </div>

          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.printBtn}
              onClick={handlePrint}
              title="Print Thermal Receipt (80mm) or PDF"
            >
              <Printer size={15} />
              Print Receipt / PDF
            </button>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Slip */}
        <div className={styles.scrollWrapper}>
          <div className={styles.receiptSlip}>
            {/* Header */}
            <div className={styles.receiptHeader}>
              <div className={styles.storeName}>{saasConfig.appName} Boutique</div>
              <div className={styles.storeTagline}>Luxury Eyewear & Optometry Clinic</div>
              <div className={styles.storeMeta}>
                <span>Tax Invoice / Retail Bill</span>
                <br />
                <span>GSTIN: 24AABCE1234F1Z5</span>
              </div>
            </div>

            {/* Invoice Meta */}
            <div className={styles.metaGrid}>
              <div className={styles.metaRow}>
                <span>Order No:</span>
                <strong>#{data.orderId}</strong>
              </div>
              <div className={styles.metaRow}>
                <span>Date & Time:</span>
                <span>{data.date} {data.time}</span>
              </div>
              <div className={styles.metaRow}>
                <span>Customer:</span>
                <strong>{data.clientName}</strong>
              </div>
              {data.clientPhone && (
                <div className={styles.metaRow}>
                  <span>Contact:</span>
                  <span>{data.clientPhone}</span>
                </div>
              )}
              <div className={styles.metaRow}>
                <span>Payment Mode:</span>
                <span>{data.paymentMethod}</span>
              </div>
              <div className={styles.metaRow}>
                <span>GST Rule:</span>
                <span>{data.billType}</span>
              </div>
            </div>

            {/* Prescription Snapshot (if available) */}
            {data.rxData && (
              <div className={styles.rxSection}>
                <div className={styles.rxTitle}>Optical Prescription</div>
                <table className={styles.rxTable}>
                  <thead>
                    <tr>
                      <th>Eye</th>
                      <th>SPH</th>
                      <th>CYL</th>
                      <th>AXIS</th>
                      <th>ADD</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>R (OD)</strong></td>
                      <td>{data.rxData.rightSph > 0 ? `+${data.rxData.rightSph}` : data.rxData.rightSph}</td>
                      <td>{data.rxData.rightCyl > 0 ? `+${data.rxData.rightCyl}` : data.rxData.rightCyl}</td>
                      <td>{data.rxData.rightAxis}°</td>
                      <td>{data.rxData.rightAdd > 0 ? `+${data.rxData.rightAdd}` : data.rxData.rightAdd}</td>
                    </tr>
                    <tr>
                      <td><strong>L (OS)</strong></td>
                      <td>{data.rxData.leftSph > 0 ? `+${data.rxData.leftSph}` : data.rxData.leftSph}</td>
                      <td>{data.rxData.leftCyl > 0 ? `+${data.rxData.leftCyl}` : data.rxData.leftCyl}</td>
                      <td>{data.rxData.leftAxis}°</td>
                      <td>{data.rxData.leftAdd > 0 ? `+${data.rxData.leftAdd}` : data.rxData.leftAdd}</td>
                    </tr>
                  </tbody>
                </table>
                {data.rxData.pdBinocular && (
                  <div style={{ marginTop: "4px", textAlign: "right" }}>
                    PD: <strong>{data.rxData.pdBinocular} mm</strong>
                  </div>
                )}
              </div>
            )}

            {/* Line Items Table */}
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th style={{ width: "55%" }}>Item</th>
                  <th style={{ width: "15%", textAlign: "center" }}>Qty</th>
                  <th style={{ width: "30%", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div><strong>{item.brand}</strong> {item.name}</div>
                      {item.hasPrescription && <div className={styles.itemSub}>+ Custom Lenses (Rx Fitted)</div>}
                    </td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>
                      {saasConfig.currency}{(item.unitPrice * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Breakdown */}
            <div className={styles.totalsSection}>
              <div className={styles.totalRow}>
                <span>Subtotal:</span>
                <span>{saasConfig.currency}{data.subtotal.toFixed(2)}</span>
              </div>

              {data.discount > 0 && (
                <div className={styles.totalRow} style={{ color: "#047857" }}>
                  <span>Member Discount:</span>
                  <span>-{saasConfig.currency}{data.discount.toFixed(2)}</span>
                </div>
              )}

              {data.cgst > 0 && (
                <div className={styles.totalRow}>
                  <span>CGST:</span>
                  <span>{saasConfig.currency}{data.cgst.toFixed(2)}</span>
                </div>
              )}

              {data.sgst > 0 && (
                <div className={styles.totalRow}>
                  <span>SGST:</span>
                  <span>{saasConfig.currency}{data.sgst.toFixed(2)}</span>
                </div>
              )}

              {data.igst > 0 && (
                <div className={styles.totalRow}>
                  <span>IGST:</span>
                  <span>{saasConfig.currency}{data.igst.toFixed(2)}</span>
                </div>
              )}

              <div className={styles.grandTotalRow}>
                <span>NET TOTAL:</span>
                <span>{saasConfig.currency}{data.grandTotal.toFixed(2)}</span>
              </div>

              <div className={styles.advanceRow}>
                <span>Amount Paid:</span>
                <span>{saasConfig.currency}{data.advancePaid.toFixed(2)}</span>
              </div>

              {data.isAdvance && data.remainingBalance > 0 && (
                <div className={styles.balanceRow}>
                  <span>BALANCE DUE ON PICKUP:</span>
                  <span>{saasConfig.currency}{data.remainingBalance.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className={styles.receiptFooter}>
              <div className={styles.barcodeBox}>|||| |||||| | ||||||||</div>
              <div className={styles.footerThanks}>Thank you for choosing {saasConfig.appName}!</div>
              <div>Frames carry a 1-year manufacturer warranty.</div>
              {data.isAdvance && <div>Estimated Delivery: 2-3 Business Days</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
