"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getProducts } from "@/app/actions/products";
import { getClients } from "@/app/actions/clients";
import { processSaleTransaction, getActiveOrders, settleOrderRemainingBalance, ActiveOrderRecord } from "@/app/actions/sales";
import styles from "./POSPage.module.css";
import { Search, ShoppingBag, Minus, Plus, Trash2, Sparkles, Building2, Tag, CheckCircle2, AlertCircle, Clock, Check, DollarSign, Receipt, Banknote, UserPlus, FileText, Eye, EyeOff, Calendar, UserCheck } from "lucide-react";
import BillingNewClientModal from "@/components/pos/BillingNewClientModal";
import EyewearSilhouette from "@/components/ui/EyewearSilhouette";
import { PaymentMethod } from "@prisma/client";
import { saasConfig } from "@/config/saasConfig";

interface POSProduct {
  id: string;
  brand: string;
  name: string;
  sku: string;
  price: number;
  badge?: string;
  category: string;
}

interface CartItem {
  product: POSProduct;
  quantity: number;
  hasPrescription: boolean;
}

interface POSClientData {
  id: string;
  name: string;
  tier: string;
  discountRate: number;
  phone: string;
  email: string;
  location: string;
  doctorName?: string;
  visitDate?: string;
  latestPrescription?: {
    doctorName?: string;
    visitDate?: string;
    rightSph: number;
    rightCyl: number;
    rightAxis: number;
    rightAdd: number;
    rightVision?: string;
    leftSph: number;
    leftCyl: number;
    leftAxis: number;
    leftAdd: number;
    leftVision?: string;
    pdBinocular?: number | null;
    lensType?: string | null;
    lensFor?: string | null;
    lensIndex?: string | null;
    lensCoating?: string | null;
    nextVisitDate?: string | null;
    deliveryDate?: string | null;
  };
}

// Indian Optical Industry Bill Types
const BILL_TYPES = [
  { id: "12% GST(L)", label: "12% GST(L)", rate: 12, isLocal: true, mode: "STANDARD" },
  { id: "12% GST(I)", label: "12% GST(I)", rate: 12, isLocal: false, mode: "STANDARD" },
  { id: "18% GST(L)", label: "18% GST(L)", rate: 18, isLocal: true, mode: "STANDARD" },
  { id: "18% GST(I)", label: "18% GST(I)", rate: 18, isLocal: false, mode: "STANDARD" },
  { id: "28% GST(L)", label: "28% GST(L)", rate: 28, isLocal: true, mode: "STANDARD" },
  { id: "28% GST(I)", label: "28% GST(I)", rate: 28, isLocal: false, mode: "STANDARD" },
  { id: "5% GST(L)", label: "5% GST(L)", rate: 5, isLocal: true, mode: "STANDARD" },
  { id: "5% GST(I)", label: "5% GST(I)", rate: 5, isLocal: false, mode: "STANDARD" },
  { id: "EXEMPT(L)", label: "EXEMPT(L)", rate: 0, isLocal: true, mode: "EXEMPT" },
  { id: "EXEMPT(I)", label: "EXEMPT(I)", rate: 0, isLocal: false, mode: "EXEMPT" },
  { id: "INCLUSIVE GST(L)", label: "INCLUSIVE GST(L)", rate: 12, isLocal: true, mode: "INCLUSIVE" },
  { id: "INCLUSIVE GST(I)", label: "INCLUSIVE GST(I)", rate: 12, isLocal: false, mode: "INCLUSIVE" },
  { id: "ITEMWISE GST(L)", label: "ITEMWISE GST(L)", rate: 12, isLocal: true, mode: "STANDARD" },
  { id: "ITEMWISE GST(I)", label: "ITEMWISE GST(I)", rate: 12, isLocal: false, mode: "STANDARD" },
  { id: "MULTIRATE GST(L)", label: "MULTIRATE GST(L)", rate: 12, isLocal: true, mode: "STANDARD" },
  { id: "MULTIRATE GST(I)", label: "MULTIRATE GST(I)", rate: 12, isLocal: false, mode: "STANDARD" },
  { id: "TAXFREE(L)", label: "TAXFREE(L)", rate: 0, isLocal: true, mode: "TAXFREE" },
  { id: "TAXFREE(I)", label: "TAXFREE(I)", rate: 0, isLocal: false, mode: "TAXFREE" },
];

const CATEGORIES = ["All", "Frames", "Lenses", "Accessories"];

export default function POSPage() {
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [clients, setClients] = useState<POSClientData[]>([]);
  const [selectedClient, setSelectedClient] = useState<POSClientData | null>(null);
  const [activeOrders, setActiveOrders] = useState<ActiveOrderRecord[]>([]);

  // Unique Order Number Generator (client-side only to avoid SSR hydration mismatch)
  const [currentOrderNumber, setCurrentOrderNumber] = useState("");
  useEffect(() => {
    const today = new Date();
    const yyyymmdd = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, "0") +
      today.getDate().toString().padStart(2, "0");
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    setCurrentOrderNumber(`ORD-${yyyymmdd}-${randomSeq}`);
  }, []);

  // Bill Metadata & Bill Type state
  const [billSeries] = useState("SALE_26-27");
  const [billType, setBillType] = useState("TAXFREE(L)");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Cart & UI collapse state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [showRxMatrix, setShowRxMatrix] = useState(true);

  // New Client Modal state
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  // Advance Payment Mode State
  const [isAdvancePayment, setIsAdvancePayment] = useState(false);
  const [advancePaidAmount, setAdvancePaidAmount] = useState<number>(0);

  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<{
    id: string;
    clientName: string;
    grandTotal: number;
    advancePaid: number;
    remainingBalance: number;
    isAdvance: boolean;
    billType: string;
  } | null>(null);

  // Fetch live products, clients & active orders
  const loadData = useCallback(async (mounted?: { current: boolean }) => {
    setLoading(true);

    const [prodRes, clientRes, orderRes] = await Promise.all([
      getProducts(selectedCategory, searchQuery),
      getClients(),
      getActiveOrders(),
    ]);

    if (mounted && !mounted.current) return;

    if (prodRes.success && prodRes.data) {
      setProducts(
        prodRes.data.map((p) => ({
          id: p.id,
          brand: p.brand,
          name: p.name,
          sku: p.sku,
          price: p.price,
          badge: p.badge ? p.badge.replace("_", " ") : undefined,
          category: p.category,
        }))
      );
    }

    if (clientRes.success && clientRes.data && clientRes.data.length > 0) {
      const clientList = clientRes.data.map((c) => {
        const latestRx = c.prescriptions?.[0];
        return {
          id: c.id,
          name: c.name,
          tier: c.tier.replace(/_/g, " "),
          discountRate: 0.1, // 10% member discount
          phone: c.phone || "",
          email: c.email || "",
          location: c.location || "Not provided",
          doctorName: "Dr. A. Sharma (Optometrist)",
          visitDate: new Date().toLocaleDateString("en-GB"),
          latestPrescription: latestRx
            ? {
              doctorName: "Dr. A. Sharma",
              visitDate: new Date().toLocaleDateString("en-GB"),
              rightSph: latestRx.rightSph,
              rightCyl: latestRx.rightCyl,
              rightAxis: latestRx.rightAxis,
              rightAdd: latestRx.rightAdd,
              rightVision: "6/6",
              leftSph: latestRx.leftSph,
              leftCyl: latestRx.leftCyl,
              leftAxis: latestRx.leftAxis,
              leftAdd: latestRx.leftAdd,
              leftVision: "6/6",
              pdBinocular: latestRx.pdBinocular || 63,
              lensType: latestRx.lensType || "Progressive",
              lensFor: "Rx",
              lensIndex: latestRx.lensIndex || "1.67 High-Index",
              lensCoating: latestRx.lensCoating || "Anti-Reflective AR",
              nextVisitDate: new Date(Date.now() + 86400000 * 180).toLocaleDateString("en-GB"),
              deliveryDate: new Date(Date.now() + 86400000 * 2).toLocaleDateString("en-GB"),
            }
            : undefined,
        };
      });
      setClients(clientList);
      setSelectedClient((prev) => prev ?? clientList[0]);
    }

    if (orderRes.success && orderRes.data) {
      setActiveOrders(orderRes.data);
    }

    setLoading(false);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    const mounted = { current: true };
    loadData(mounted);
    return () => {
      mounted.current = false;
    };
  }, [loadData]);

  // Cart helper functions
  const addToCart = (product: POSProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, hasPrescription: false }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const resetCart = () => {
    setCart([]);
    setStatusMsg(null);
    setIsAdvancePayment(false);
    setAdvancePaidAmount(0);
  };

  // ─── DYNAMIC GST BILL TYPE CALCULATION ENGINE ────────────────────────────
  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discountRate = selectedClient ? selectedClient.discountRate : 0;
    const discount = subtotal * discountRate;
    const grossAfterDiscount = Math.max(0, subtotal - discount);

    const config = BILL_TYPES.find((b) => b.id === billType) || BILL_TYPES[0];
    const { rate, isLocal, mode } = config;

    let taxableAmount = grossAfterDiscount;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let totalTax = 0;

    if (mode === "TAXFREE" || mode === "EXEMPT" || rate === 0) {
      taxableAmount = grossAfterDiscount;
      cgst = 0;
      sgst = 0;
      igst = 0;
      totalTax = 0;
    } else if (mode === "INCLUSIVE") {
      taxableAmount = grossAfterDiscount / (1 + rate / 100);
      totalTax = grossAfterDiscount - taxableAmount;
      if (isLocal) {
        cgst = totalTax / 2;
        sgst = totalTax / 2;
      } else {
        igst = totalTax;
      }
    } else {
      taxableAmount = grossAfterDiscount;
      totalTax = taxableAmount * (rate / 100);
      if (isLocal) {
        cgst = totalTax / 2;
        sgst = totalTax / 2;
      } else {
        igst = totalTax;
      }
    }

    const grandTotal = mode === "INCLUSIVE" ? grossAfterDiscount : Math.max(0, taxableAmount + totalTax);

    return {
      subtotal,
      discount,
      taxableAmount,
      rate,
      isLocal,
      mode,
      cgst,
      sgst,
      igst,
      totalTax,
      grandTotal,
    };
  }, [cart, selectedClient, billType]);

  const remainingBalance = isAdvancePayment ? Math.max(0, totals.grandTotal - advancePaidAmount) : 0;

  // Handle Process Transaction
  const handleProcessTransaction = async () => {
    if (!selectedClient) {
      setStatusMsg({ type: "error", text: "No client selected." });
      return;
    }

    if (cart.length === 0) {
      setStatusMsg({ type: "error", text: "Cart is empty. Add items before processing." });
      return;
    }

    setProcessing(true);
    setStatusMsg(null);

    const paidNow = isAdvancePayment ? advancePaidAmount : totals.grandTotal;

    const result = await processSaleTransaction({
      clientId: selectedClient.id,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price,
        hasPrescription: item.hasPrescription,
      })),
      paymentMethod,
      subtotal: totals.subtotal,
      discount: totals.discount,
      grandTotal: totals.grandTotal,
      isAdvancePayment,
      advancePaidAmount: paidNow,
      remainingBalance,
    });

    setProcessing(false);

    if (result.success && result.data) {
      setReceiptData({
        id: result.data.id || currentOrderNumber,
        clientName: selectedClient.name,
        grandTotal: totals.grandTotal,
        advancePaid: paidNow,
        remainingBalance: result.data.remainingBalance,
        isAdvance: isAdvancePayment,
        billType,
      });

      setStatusMsg({
        type: "success",
        text: isAdvancePayment
          ? `Advance Recorded! Order #${result.data.id || currentOrderNumber} Deposit: ${saasConfig.currency}${paidNow} | Balance: ${saasConfig.currency}${result.data.remainingBalance}`
          : `Invoice #${result.data.id || currentOrderNumber} processed successfully with ${billType}!`,
      });
      setCart([]);
      setIsAdvancePayment(false);
      setAdvancePaidAmount(0);
      loadData();
    } else {
      setStatusMsg({ type: "error", text: result.error || "Failed to process transaction." });
    }
  };

  const handleSettleOrder = async (orderId: string) => {
    const res = await settleOrderRemainingBalance(orderId);
    if (res.success) {
      setStatusMsg({ type: "success", text: res.message || "Order balance settled and delivered!" });
      loadData();
    }
  };

  return (
    <div className={styles.layoutContainer}>
      {/* ─── 1. TOP HORIZONTAL SECTION: USER DETAILS & BILL HEADER ─── */}
      <div className={styles.userHeaderBar}>
        <div className={styles.topRow}>
          {/* Bill Series, Unique Date-Formatted Order No & Bill Type */}
          <div className={styles.billInfoGroup}>
            <div className={styles.billChip}>
              <span>Series:</span>
              <span className={styles.billChipValue}>{billSeries}</span>
            </div>
            <div className={`${styles.billChip} ${styles.orderNumChip}`}>
              <span>Order No:</span>
              <span className={styles.billChipValue}>{currentOrderNumber}</span>
            </div>
            <div className={styles.billChip}>
              <span>Date:</span>
              <span className={styles.billChipValue}>{new Date().toLocaleDateString("en-GB")}</span>
            </div>

            {/* Bill Type Dropdown Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#d4af37", textTransform: "uppercase" }}>
                Bill Type:
              </span>
              <select
                value={billType}
                onChange={(e) => setBillType(e.target.value)}
                className={styles.billTypeSelect}
                title="Select Bill Tax Type (Local / Interstate, Taxable / Tax Free)"
              >
                {BILL_TYPES.map((bt) => (
                  <option key={bt.id} value={bt.id}>
                    {bt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Party A/C Client Selector + New Client Button */}
          <div className={styles.partyGroup}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              Party A/C:
            </span>
            {clients.length > 0 ? (
              <select
                value={selectedClient?.id || ""}
                onChange={(e) => {
                  const found = clients.find((c) => c.id === e.target.value);
                  if (found) setSelectedClient(found);
                }}
                className={styles.partySelect}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || c.location || "Client"})
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ color: "#94a3b8", fontSize: "13px" }}>No registered clients</span>
            )}

            <button
              type="button"
              onClick={() => setIsNewClientModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 10px",
                background: "rgba(212, 175, 55, 0.18)",
                border: "1px solid rgba(212, 175, 55, 0.4)",
                borderRadius: "8px",
                color: "#d4af37",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <UserPlus size={13} /> + Customer
            </button>
          </div>
        </div>

        {/* Prescription (Rx) & Referred Doctor Summary Bar with Toggle (Non-Cluttered UX) */}
        {selectedClient && (
          <div className={styles.rxBar}>
            <div className={styles.rxBarHeader}>
              <div className={styles.partyDetailsPill}>
                <span className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>Phone:</span> <strong>{selectedClient.phone || "-"}</strong>
                </span>
                <span className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>RefBy / Doctor:</span> <strong style={{ color: "#38bdf8" }}>{selectedClient.latestPrescription?.doctorName || selectedClient.doctorName || "Dr. A. Sharma"}</strong>
                </span>
                <span className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>Referred Date:</span> <strong>{selectedClient.latestPrescription?.visitDate || selectedClient.visitDate || new Date().toLocaleDateString("en-GB")}</strong>
                </span>
                <span className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>Tier:</span> <strong style={{ color: "#d4af37" }}>{selectedClient.tier}</strong>
                </span>
              </div>

              {/* Show / Hide Rx Matrix Toggle Button */}
              <button
                type="button"
                onClick={() => setShowRxMatrix((prev) => !prev)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  background: showRxMatrix ? "rgba(56, 189, 248, 0.15)" : "transparent",
                  color: "#38bdf8",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {showRxMatrix ? <EyeOff size={13} /> : <Eye size={13} />}
                {showRxMatrix ? "Hide Rx Matrix" : "View Rx Matrix"}
              </button>
            </div>

            {/* EXPANDABLE COMPACT RX PRESCRIPTION MATRIX — Separate tables per eye */}
            {showRxMatrix && selectedClient.latestPrescription && (() => {
              const rx = selectedClient.latestPrescription;
              const rNV = rx.rightAdd > 0 ? rx.rightSph + rx.rightAdd : null;
              const lNV = rx.leftAdd > 0 ? rx.leftSph + rx.leftAdd : null;
              const lensLabel = (rx.rightAdd > 0 || rx.leftAdd > 0) ? (rx.lensType || "Multifocal") : (rx.lensType || "Single Vision");
              const fmtSph = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2);
              return (
                <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
                  {/* ── Right Eye (OD) ── */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: "#d4af37", textTransform: "uppercase", marginBottom: "2px", letterSpacing: "0.06em" }}>Right Eye (OD)</div>
                    <table className={styles.rxTableCompact} style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          <th>Vision</th>
                          <th>SPH / PWR</th>
                          <th>CYL</th>
                          <th>AXIS</th>
                          <th>V/N</th>
                          <th>ADD</th>
                          <th>P.D.</th>
                          <th>Lens</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ color: "#94a3b8", fontWeight: 700, fontSize: "9px" }}>DV</td>
                          <td>{fmtSph(rx.rightSph)}</td>
                          <td>{fmtSph(rx.rightCyl)}</td>
                          <td>{rx.rightAxis}°</td>
                          <td>{rx.rightVision || "6/6"}</td>
                          <td>{rx.rightAdd > 0 ? `+${rx.rightAdd.toFixed(2)}` : "—"}</td>
                          <td rowSpan={rNV ? 2 : 1} style={{ verticalAlign: "middle" }}>{rx.pdBinocular || 63} mm</td>
                          <td rowSpan={rNV ? 2 : 1} style={{ verticalAlign: "middle", color: "#38bdf8" }}>{lensLabel}</td>
                        </tr>
                        {rNV !== null && (
                          <tr>
                            <td style={{ color: "#38bdf8", fontWeight: 700, fontSize: "9px" }}>NV</td>
                            <td style={{ color: "#38bdf8", fontWeight: 700 }}>{fmtSph(rNV)}</td>
                            <td>{fmtSph(rx.rightCyl)}</td>
                            <td>{rx.rightAxis}°</td>
                            <td style={{ color: "#94a3b8" }}>Near</td>
                            <td>—</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Left Eye (OS) ── */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: "#d4af37", textTransform: "uppercase", marginBottom: "2px", letterSpacing: "0.06em" }}>Left Eye (OS)</div>
                    <table className={styles.rxTableCompact} style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          <th>Vision</th>
                          <th>SPH / PWR</th>
                          <th>CYL</th>
                          <th>AXIS</th>
                          <th>V/N</th>
                          <th>ADD</th>
                          <th>P.D.</th>
                          <th>Lens</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ color: "#94a3b8", fontWeight: 700, fontSize: "9px" }}>DV</td>
                          <td>{fmtSph(rx.leftSph)}</td>
                          <td>{fmtSph(rx.leftCyl)}</td>
                          <td>{rx.leftAxis}°</td>
                          <td>{rx.leftVision || "6/6"}</td>
                          <td>{rx.leftAdd > 0 ? `+${rx.leftAdd.toFixed(2)}` : "—"}</td>
                          <td rowSpan={lNV ? 2 : 1} style={{ verticalAlign: "middle" }}>{rx.pdBinocular || 63} mm</td>
                          <td rowSpan={lNV ? 2 : 1} style={{ verticalAlign: "middle", color: "#38bdf8" }}>{lensLabel}</td>
                        </tr>
                        {lNV !== null && (
                          <tr>
                            <td style={{ color: "#38bdf8", fontWeight: 700, fontSize: "9px" }}>NV</td>
                            <td style={{ color: "#38bdf8", fontWeight: 700 }}>{fmtSph(lNV)}</td>
                            <td>{fmtSph(rx.leftCyl)}</td>
                            <td>{rx.leftAxis}°</td>
                            <td style={{ color: "#94a3b8" }}>Near</td>
                            <td>—</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ─── 2. MAIN WORKSPACE BELOW USER DETAILS HEADER ─── */}
      <div className={styles.mainWorkspace}>
        {/* Left — Product Catalog Selection Panel & Active Orders */}
        <div className={styles.left}>
          <div className={styles.searchRow}>
            <div className={styles.searchWrap}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="search"
                placeholder="Search collection, brand or model..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.catGroup}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.catTab} ${selectedCategory === cat ? styles.catTabActive : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          {loading ? (
            <div className={styles.loadingGrid}>Loading inventory products…</div>
          ) : (
            <div className={styles.productGrid}>
              {products.map((p) => (
                <div
                  key={p.id}
                  className={styles.productTile}
                  onClick={() => addToCart(p)}
                  role="button"
                  tabIndex={0}
                >
                  {p.badge && (
                    <span className={`${styles.tileBadge} ${p.badge === "IN STOCK" ? styles.tileBadgeGreen : styles.tileBadgeGold}`}>
                      {p.badge}
                    </span>
                  )}
                  <div className={styles.tileImage}>
                    <EyewearSilhouette color="#C9A96E" size={38} />
                  </div>
                  <div className={styles.tileBrand}>{p.brand}</div>
                  <div className={styles.tileName}>{p.name}</div>
                  <div className={styles.tilePrice}>{saasConfig.currency}{p.price.toFixed(2)}</div>
                </div>
              ))}

              {/* Consultation Service Tile */}
              <div
                className={`${styles.productTile} ${styles.productTileDashed}`}
                onClick={() =>
                  addToCart({
                    id: "bespoke-consultation-item",
                    brand: saasConfig.appName.toUpperCase(),
                    name: "Bespoke Fitting & Lens Customization",
                    sku: "BSPK-CONSULT",
                    price: 250.0,
                    category: "Services",
                    badge: "BESPOKE",
                  })
                }
                role="button"
                tabIndex={0}
                title="Click to add Bespoke Fitting & Customization to bag"
              >
                <div className={styles.tileImage}>
                  <Sparkles size={22} color="var(--color-gold)" opacity={0.8} />
                </div>
                <div className={styles.tileConsult}>BESPOKE CONSULTATION ITEM</div>
                <div className={styles.tilePrice} style={{ color: "var(--color-gold-dark)", marginTop: "2px" }}>
                  {saasConfig.currency}250.00
                </div>
              </div>
            </div>
          )}

          {/* Active Orders Section */}
          {activeOrders.length > 0 && (
            <div style={{ marginTop: "1rem", background: "rgba(15, 23, 42, 0.6)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "0.85rem" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={14} color="#38bdf8" /> Active Orders & Pending Advance Balances
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {activeOrders.map((ord) => (
                  <div key={ord.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(2, 6, 23, 0.6)", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#f8fafc" }}>
                        {ord.clientName} <span style={{ color: "#64748b", fontSize: "0.72rem" }}>({ord.id})</span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                        Total: {saasConfig.currency}{ord.grandTotal} | Paid: <strong style={{ color: "#34d399" }}>{saasConfig.currency}{ord.advancePaid}</strong> | Due: <strong style={{ color: "#f87171" }}>{saasConfig.currency}{ord.remainingBalance}</strong>
                      </div>
                    </div>

                    {ord.remainingBalance > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleSettleOrder(ord.id)}
                        style={{
                          padding: "5px 10px",
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <DollarSign size={12} /> Settle & Deliver
                      </button>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: "#34d399", fontWeight: 600 }}>
                        <Check size={13} /> Paid
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Bag / Cart & Billing Breakdown Panel */}
        <div className={styles.right}>
          <div className={styles.checkoutPanel}>
            <div className={styles.checkoutHeader}>
              <h2 className={styles.checkoutTitle}>Order Item Selections & Bag</h2>
              <button type="button" className={styles.resetBag} onClick={resetCart}>
                RESET BAG
              </button>
            </div>

            {statusMsg && (
              <div className={`${styles.statusBanner} ${statusMsg.type === "success" ? styles.statusSuccess : styles.statusError}`}>
                {statusMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            {/* Cart Items List */}
            <div className={styles.cartItems}>
              {cart.length === 0 ? (
                <div className={styles.emptyCart}>
                  <ShoppingBag size={28} strokeWidth={1.2} opacity={0.4} />
                  <p>Click any item on the left catalog to add to billing bag.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className={styles.cartItem}>
                    <div className={styles.cartItemImg}>
                      <EyewearSilhouette color="#C9A96E" size={24} />
                    </div>
                    <div className={styles.cartItemInfo}>
                      <div className={styles.cartItemName}>{item.product.name}</div>
                      <div className={styles.cartItemDesc}>{item.product.brand} • {saasConfig.currency}{item.product.price.toFixed(2)}</div>
                      <div className={styles.cartItemControls}>
                        <button
                          type="button"
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus size={11} />
                        </button>
                        <span className={styles.qty}>{item.quantity}</span>
                        <button
                          type="button"
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                    <div className={styles.cartItemRight}>
                      <span className={styles.cartItemPrice}>
                        {saasConfig.currency}{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => removeFromCart(item.product.id)}
                        aria-label="Delete item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Dynamic GST Billing Calculations */}
            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Gross Subtotal</span>
                <span>{saasConfig.currency}{totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.discount > 0 && (
                <div className={styles.totalRow}>
                  <span className={styles.discountLabel}>
                    <Tag size={12} /> Member Discount (10%)
                  </span>
                  <span className={styles.discountValue}>-{saasConfig.currency}{totals.discount.toFixed(2)}</span>
                </div>
              )}

              <div className={styles.totalRow} style={{ fontWeight: 600, color: "#f8fafc" }}>
                <span>Taxable Amount</span>
                <span>{saasConfig.currency}{totals.taxableAmount.toFixed(2)}</span>
              </div>

              {/* CGST + SGST (Local) vs IGST (Interstate) — hidden for Tax-Free / Exempt */}
              {totals.mode !== "TAXFREE" && totals.mode !== "EXEMPT" && totals.rate > 0 && (
                totals.isLocal ? (
                  <>
                    <div className={styles.totalRow}>
                      <span>CGST ({(totals.rate / 2).toFixed(1)}%)</span>
                      <span>{saasConfig.currency}{totals.cgst.toFixed(2)}</span>
                    </div>
                    <div className={styles.totalRow}>
                      <span>SGST ({(totals.rate / 2).toFixed(1)}%)</span>
                      <span>{saasConfig.currency}{totals.sgst.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className={styles.totalRow}>
                    <span>IGST ({totals.rate}%)</span>
                    <span>{saasConfig.currency}{totals.igst.toFixed(2)}</span>
                  </div>
                )
              )}

              <div className={`${styles.totalRow} ${styles.grandTotalRow}`}>
                <span>Grand Total</span>
                <span>{saasConfig.currency}{totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Type Selector (Full vs Advance) */}
            <div style={{ background: "rgba(15, 23, 42, 0.9)", padding: "8px", borderRadius: "8px", border: "1px solid rgba(212, 175, 55, 0.3)", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#d4af37", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Select Payment Mode
              </span>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => { setIsAdvancePayment(false); setAdvancePaidAmount(0); }}
                  style={{
                    padding: "7px",
                    borderRadius: "6px",
                    border: !isAdvancePayment ? "1px solid #d4af37" : "1px solid rgba(255,255,255,0.1)",
                    background: !isAdvancePayment ? "rgba(212, 175, 55, 0.2)" : "rgba(2, 6, 23, 0.5)",
                    color: !isAdvancePayment ? "#f8fafc" : "#94a3b8",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  💳 Full Payment ({saasConfig.currency}{totals.grandTotal.toFixed(2)})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAdvancePayment(true);
                    setAdvancePaidAmount(Math.round(totals.grandTotal * 0.5) || 50);
                  }}
                  style={{
                    padding: "7px",
                    borderRadius: "6px",
                    border: isAdvancePayment ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.1)",
                    background: isAdvancePayment ? "rgba(56, 189, 248, 0.2)" : "rgba(2, 6, 23, 0.5)",
                    color: isAdvancePayment ? "#38bdf8" : "#94a3b8",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ⚡ Advance Deposit
                </button>
              </div>

              {isAdvancePayment && (
                <div style={{ background: "rgba(2, 6, 23, 0.7)", padding: "6px 8px", borderRadius: "6px", border: "1px dashed rgba(56, 189, 248, 0.4)", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ fontSize: "0.72rem", color: "#e2e8f0" }}>Deposit Paid Today ({saasConfig.currency}):</label>
                    <input
                      type="number"
                      min={1}
                      max={totals.grandTotal}
                      value={advancePaidAmount}
                      onChange={(e) => setAdvancePaidAmount(Number(e.target.value))}
                      style={{
                        width: "90px",
                        padding: "4px 6px",
                        background: "#0f172a",
                        border: "1px solid #38bdf8",
                        borderRadius: "6px",
                        color: "#38bdf8",
                        fontSize: "0.825rem",
                        fontWeight: 700,
                        textAlign: "right",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#f87171", fontWeight: 600 }}>
                    <span>Remaining Balance:</span>
                    <span>{saasConfig.currency}{remainingBalance.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className={styles.paymentMethods}>
              <button
                type="button"
                className={`${styles.payBtn} ${paymentMethod === PaymentMethod.CASH ? styles.payBtnActive : ""}`}
                onClick={() => setPaymentMethod(PaymentMethod.CASH)}
              >
                <Banknote size={15} /> CASH
              </button>
              <button
                type="button"
                className={`${styles.payBtn} ${paymentMethod === PaymentMethod.WIRE_TRANSFER ? styles.payBtnActive : ""}`}
                onClick={() => setPaymentMethod(PaymentMethod.WIRE_TRANSFER)}
              >
                <Building2 size={15} /> UPI
              </button>
            </div>

            {/* Process Transaction Button */}
            <button
              type="button"
              className={styles.processBtn}
              onClick={handleProcessTransaction}
              disabled={processing || cart.length === 0}
              style={{
                background: isAdvancePayment
                  ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
                  : undefined,
              }}
            >
              {processing
                ? "Processing Invoice…"
                : isAdvancePayment
                  ? `Record Advance (${saasConfig.currency}${advancePaidAmount} Paid)`
                  : `Place Order`}
            </button>
          </div>
        </div>
      </div>

      {/* New Client Modal */}
      <BillingNewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onSuccess={(newClient) => {
          const posClient: POSClientData = {
            id: newClient.id,
            name: newClient.name,
            tier: newClient.tier,
            discountRate: 0.1,
            phone: newClient.phone || "",
            email: newClient.email || "",
            location: newClient.location || "",
            doctorName: newClient.doctorName || "Dr. A. Sharma",
            visitDate: newClient.visitDate || new Date().toLocaleDateString("en-GB"),
            latestPrescription: newClient.latestPrescription,
          };
          setClients((prev) => [posClient, ...prev]);
          setSelectedClient(posClient);
          setIsNewClientModalOpen(false);
        }}
      />

      {/* Sales Receipt Modal */}
      {receiptData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#0f172a", border: "1px solid rgba(212, 175, 55, 0.4)", borderRadius: "16px", padding: "1.5rem", maxWidth: "420px", width: "100%", color: "#f8fafc", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Receipt size={22} color="#d4af37" />
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{saasConfig.appName} Tax Invoice</h3>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Order ID: #{receiptData.id} | {receiptData.billType}</span>
              </div>
            </div>

            <div style={{ background: "rgba(2, 6, 23, 0.8)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Customer:</span>
                <strong>{receiptData.clientName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Order Number:</span>
                <strong style={{ color: "#d4af37" }}>{receiptData.id}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Grand Total:</span>
                <strong>{saasConfig.currency}{receiptData.grandTotal.toFixed(2)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#34d399" }}>
                <span>Paid Today:</span>
                <strong>{saasConfig.currency}{receiptData.advancePaid.toFixed(2)}</strong>
              </div>

              {receiptData.isAdvance && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#f87171", fontWeight: 700, paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <span>Remaining Due on Delivery:</span>
                  <span>{saasConfig.currency}{receiptData.remainingBalance.toFixed(2)}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setReceiptData(null)}
              style={{
                padding: "10px",
                background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)",
                color: "#0b0f19",
                fontWeight: 700,
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Close & Print Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}