"use client";

import { useState } from "react";
import { X, Glasses, Disc, ShoppingBag, PlusCircle, Percent, ArrowUpRight } from "lucide-react";
import { createProduct } from "@/app/actions/products";
import { recordStockPurchase } from "@/app/actions/purchases";
import { ProductCategory, ProductBadge } from "@prisma/client";
import { ProductItem } from "./ProductCard";
import styles from "./AddProductAndPurchaseModal.module.css";
import { saasConfig } from "@/config/saasConfig";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  onSuccess: () => void;
}

const INDIAN_GST_RATES = [
  { rate: 0, label: "0% Exempt" },
  { rate: 5, label: "5% GST" },
  { rate: 12, label: "12% GST" },
  { rate: 18, label: "18% GST" },
  { rate: 28, label: "28% GST" },
];

export default function AddProductAndPurchaseModal({ isOpen, onClose, products, onSuccess }: Props) {
  const [modalMode, setModalMode] = useState<"NEW_PRODUCT" | "RESTOCK_EXISTING">("NEW_PRODUCT");
  const [productType, setProductType] = useState<"FRAME" | "LENS">("FRAME");

  // New Product Fields
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [category, setCategory] = useState<ProductCategory>(ProductCategory.FRAMES);
  const [badge, setBadge] = useState<ProductBadge | "NONE">("NONE");

  // Frame Fields
  const [frameMaterial, setFrameMaterial] = useState("Italian Acetate");
  const [frameShape, setFrameShape] = useState("Square");
  const [frameType, setFrameType] = useState("Full Rim");
  const [color, setColor] = useState("");
  const [gender, setGender] = useState("Unisex");

  // Lens Fields
  const [lensType, setLensType] = useState("Progressive");
  const [lensIndex, setLensIndex] = useState("1.67 High Index");
  const [lensCoating, setLensCoating] = useState("Anti-Reflective + Blue Light Filter");

  // Purchase & Inventory Entry Fields
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [quantity, setQuantity] = useState<number>(10);
  const [unitCostInput, setUnitCostInput] = useState<number>(50);

  // GST Options
  const [gstIncluded, setGstIncluded] = useState<boolean>(true);
  const [gstRate, setGstRate] = useState<number>(12); // standard eyewear GST in India

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Cost & GST Calculations
  const enteredCost = Number(unitCostInput) || 0;
  const rateFraction = gstRate / 100;

  // Calculate Net Cost and GST amount based on optional gstIncluded
  let netUnitCost = enteredCost;
  let gstPerUnit = 0;
  let finalCostPerUnit = enteredCost;

  if (gstIncluded) {
    netUnitCost = enteredCost / (1 + rateFraction);
    gstPerUnit = enteredCost - netUnitCost;
    finalCostPerUnit = enteredCost;
  } else {
    netUnitCost = enteredCost;
    gstPerUnit = enteredCost * rateFraction;
    finalCostPerUnit = enteredCost + gstPerUnit;
  }

  const totalExpenditure = (quantity || 0) * finalCostPerUnit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (modalMode === "NEW_PRODUCT") {
      const isLens = productType === "LENS";
      const selectedCategory = isLens ? ProductCategory.BESPOKE_LENSES : category;
      const finalBrand = isLens ? (brand || "BESPOKE LENS") : brand;

      const res = await createProduct({
        brand: finalBrand,
        name: isLens ? `${name} (${lensType} ${lensIndex})` : name,
        sku: sku.toUpperCase(),
        price: Number(retailPrice),
        costPrice: Number(finalCostPerUnit.toFixed(2)),
        category: selectedCategory,
        badge: badge === "NONE" ? null : badge,
        stock: Number(quantity),
        frameMaterial: isLens ? `Lens Coating: ${lensCoating}` : frameMaterial,
        frameShape: isLens ? `Type: ${lensType}` : frameShape,
        frameType: isLens ? `Index: ${lensIndex}` : frameType,
        color: isLens ? lensCoating : color,
        gender: isLens ? "Universal" : gender,
        purchaseDetails: supplierName
          ? {
              supplierName,
              invoiceNumber,
              quantity: Number(quantity),
              unitCost: Number(finalCostPerUnit.toFixed(2)),
              gstIncluded,
              gstRate,
            }
          : undefined,
      });

      setLoading(false);

      if (!res.success) {
        setError(res.error || "Failed to create product.");
        return;
      }
    } else {
      // RESTOCK EXISTING PRODUCT
      const targetId = selectedProductId || products[0]?.id;
      if (!targetId) {
        setError("Please select a product to restock.");
        setLoading(false);
        return;
      }
      if (!supplierName) {
        setError("Please enter the supplier / vendor name.");
        setLoading(false);
        return;
      }

      const res = await recordStockPurchase({
        productId: targetId,
        supplierName,
        invoiceNumber,
        quantity: Number(quantity),
        unitCost: Number(finalCostPerUnit.toFixed(2)),
        gstIncluded,
        gstRate,
      });

      setLoading(false);

      if (!res.success) {
        setError(res.error || "Failed to record purchase.");
        return;
      }
    }

    onSuccess();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose} aria-modal="true" role="dialog">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <ShoppingBag size={18} color="#d4af37" /> Add Product & Inventory Purchase
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {/* Mode Switcher: New Product vs Restock Existing */}
          <div className={styles.tabBar}>
            <button
              type="button"
              className={`${styles.tabBtn} ${modalMode === "NEW_PRODUCT" ? styles.tabBtnActive : ""}`}
              onClick={() => setModalMode("NEW_PRODUCT")}
            >
              <PlusCircle size={15} /> Create New Product & Purchase
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${modalMode === "RESTOCK_EXISTING" ? styles.tabBtnActive : ""}`}
              onClick={() => setModalMode("RESTOCK_EXISTING")}
            >
              <ShoppingBag size={15} /> Restock Existing Inventory
            </button>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            {modalMode === "NEW_PRODUCT" ? (
              <>
                {/* Product Type (Frame vs Lens) Switcher */}
                <div style={{ display: "flex", gap: "8px", background: "rgba(2, 6, 23, 0.5)", padding: "4px", borderRadius: "8px" }}>
                  <button
                    type="button"
                    onClick={() => { setProductType("FRAME"); setCategory(ProductCategory.FRAMES); }}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "none",
                      background: productType === "FRAME" ? "rgba(212, 175, 55, 0.2)" : "transparent",
                      color: productType === "FRAME" ? "#d4af37" : "#94a3b8",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    <Glasses size={15} /> Frame / Glasses
                  </button>
                  <button
                    type="button"
                    onClick={() => { setProductType("LENS"); setCategory(ProductCategory.BESPOKE_LENSES); }}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "none",
                      background: productType === "LENS" ? "rgba(59, 130, 246, 0.2)" : "transparent",
                      color: productType === "LENS" ? "#60a5fa" : "#94a3b8",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    <Disc size={15} /> Bespoke Lens
                  </button>
                </div>

                {/* Product Core Details */}
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Brand Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RAY-BAN / ZEISS"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>SKU / Model Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RB-5154"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Model Name & Specification *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clubmaster Classic Black Titanium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Selling Retail Price ({saasConfig.currency}) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="3500.00"
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Initial Stock Quantity *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className={styles.input}
                    />
                  </div>
                </div>
              </>
            ) : (
              /* RESTOCK EXISTING PRODUCT */
              <div className={styles.field}>
                <label className={styles.label}>Select Product to Restock *</label>
                <select
                  className={styles.select}
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brand} {p.name} ({p.sku}) — Retail: {saasConfig.currency}{p.price}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Vendor Purchase Details */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Supplier / Vendor Name {modalMode === "RESTOCK_EXISTING" ? "*" : ""}</label>
                <input
                  type="text"
                  required={modalMode === "RESTOCK_EXISTING"}
                  placeholder="e.g. Luxottica India, Essilor"
                  className={styles.input}
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Invoice / Bill Number</label>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-99"
                  className={styles.input}
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
            </div>

            {modalMode === "RESTOCK_EXISTING" && (
              <div className={styles.field}>
                <label className={styles.label}>Purchase Quantity (Units) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  className={styles.input}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
            )}

            {/* COST PRICE & GST SELECTION TRAY BOX */}
            <div className={styles.gstBox}>
              <div className={styles.gstHeader}>
                <span className={styles.gstTitle}>
                  <Percent size={15} /> Unit Purchase Cost & Optical GST Details
                </span>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={gstIncluded}
                    onChange={(e) => setGstIncluded(e.target.checked)}
                  />
                  Include GST in cost price
                </label>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>
                    Cost Price per Unit ({saasConfig.currency}) {gstIncluded ? "(Inclusive of GST)" : "(Exclusive of GST)"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    className={styles.input}
                    value={unitCostInput}
                    onChange={(e) => setUnitCostInput(Number(e.target.value))}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Optical Industry GST Tax Tray</label>
                  <div className={styles.gstTray}>
                    {INDIAN_GST_RATES.map((item) => (
                      <button
                        key={item.rate}
                        type="button"
                        className={`${styles.gstChip} ${gstRate === item.rate ? styles.gstChipActive : ""}`}
                        onClick={() => setGstRate(item.rate)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* GST Breakdown Summary */}
              <div className={styles.gstSummary}>
                <div>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>
                    Net Base Cost: <strong style={{ color: "#f8fafc" }}>{saasConfig.currency}{netUnitCost.toFixed(2)}</strong> | GST ({gstRate}%): <strong style={{ color: "#38bdf8" }}>{saasConfig.currency}{gstPerUnit.toFixed(2)}</strong> / unit
                  </span>
                  <span style={{ color: "#e2e8f0", fontSize: "0.78rem" }}>
                    Final Cost per Unit: <strong>{saasConfig.currency}{finalCostPerUnit.toFixed(2)}</strong>
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block" }}>Total Purchase Expenditure</span>
                  <span className={styles.summaryTotal}>
                    {saasConfig.currency}{totalExpenditure.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? "Processing…" : modalMode === "NEW_PRODUCT" ? "Save Product & Stock" : "Record Purchase"}
                <ArrowUpRight size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
