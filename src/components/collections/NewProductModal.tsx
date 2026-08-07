"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createProduct } from "@/app/actions/products";
import { ProductCategory, ProductBadge } from "@prisma/client";
import styles from "./NewProductModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewProductModal({ isOpen, onClose, onSuccess }: Props) {
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [category, setCategory] = useState<ProductCategory>(ProductCategory.FRAMES);
  const [badge, setBadge] = useState<ProductBadge | "NONE">("NONE");
  const [stock, setStock] = useState("10");

  const [frameMaterial, setFrameMaterial] = useState("Italian Acetate");
  const [frameShape, setFrameShape] = useState("Square");
  const [frameType, setFrameType] = useState("Full Rim");
  const [color, setColor] = useState("");
  const [lensWidth, setLensWidth] = useState("52");
  const [bridgeWidth, setBridgeWidth] = useState("18");
  const [templeLength, setTempleLength] = useState("145");
  const [gender, setGender] = useState("Unisex");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await createProduct({
      brand,
      name,
      sku,
      price: Number(price),
      costPrice: costPrice ? Number(costPrice) : undefined,
      category,
      badge: badge === "NONE" ? null : badge,
      stock: Number(stock),
      frameMaterial,
      frameShape,
      frameType,
      color,
      lensWidth: lensWidth ? Number(lensWidth) : undefined,
      bridgeWidth: bridgeWidth ? Number(bridgeWidth) : undefined,
      templeLength: templeLength ? Number(templeLength) : undefined,
      gender,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to create product.");
      return;
    }

    setBrand("");
    setName("");
    setSku("");
    setPrice("");
    setCostPrice("");
    setColor("");
    setBadge("NONE");
    onSuccess();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose} aria-modal="true" role="dialog">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>New Eyewear Product Curation</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-brand">Brand Name *</label>
              <input
                id="prod-brand"
                type="text"
                required
                placeholder="e.g. OLIVER PEOPLES / CARTIER"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-sku">SKU Code *</label>
              <input
                id="prod-sku"
                type="text"
                required
                placeholder="e.g. OP-GP-52"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="prod-name">Model Name & Description *</label>
            <input
              id="prod-name"
              type="text"
              required
              placeholder="e.g. Gregory Peck Bespoke Titanium Edition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-price">Retail Price ($) *</label>
              <input
                id="prod-price"
                type="number"
                step="0.01"
                required
                placeholder="540.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-cost">Cost Price ($)</label>
              <input
                id="prod-cost"
                type="number"
                step="0.01"
                placeholder="210.00"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-stock">Stock Count</label>
              <input
                id="prod-stock"
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Eyewear Frame Blueprint Specifications */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-mat">Frame Material</label>
              <select
                id="prod-mat"
                value={frameMaterial}
                onChange={(e) => setFrameMaterial(e.target.value)}
                className={styles.select}
              >
                <option value="Italian Acetate">Italian Acetate</option>
                <option value="Pure Titanium">Pure Titanium</option>
                <option value="Stainless Steel">Stainless Steel</option>
                <option value="Gold-Plated Metal">Gold-Plated Metal</option>
                <option value="Natural Wood & Acetate">Natural Wood & Acetate</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-shape">Frame Shape</label>
              <select
                id="prod-shape"
                value={frameShape}
                onChange={(e) => setFrameShape(e.target.value)}
                className={styles.select}
              >
                <option value="Square">Square</option>
                <option value="Aviator">Aviator</option>
                <option value="Round">Round</option>
                <option value="Cat-Eye">Cat-Eye</option>
                <option value="Wayfarer">Wayfarer</option>
                <option value="Geometric">Geometric</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-type">Rim Structure</label>
              <select
                id="prod-type"
                value={frameType}
                onChange={(e) => setFrameType(e.target.value)}
                className={styles.select}
              >
                <option value="Full Rim">Full Rim</option>
                <option value="Semi-Rimless">Semi-Rimless</option>
                <option value="Rimless">Rimless</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-color">Color & Finish</label>
              <input
                id="prod-color"
                type="text"
                placeholder="e.g. Tortoiseshell & Rose Gold"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-gender">Target Audience</label>
              <select
                id="prod-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={styles.select}
              >
                <option value="Unisex">Unisex</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
              </select>
            </div>
          </div>

          {/* Frame Measurement Numbers (Lens Width - Bridge - Temple) */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-lensw">Lens Width (A - mm)</label>
              <input
                id="prod-lensw"
                type="number"
                value={lensWidth}
                onChange={(e) => setLensWidth(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-bridgew">Bridge Width (DBL - mm)</label>
              <input
                id="prod-bridgew"
                type="number"
                value={bridgeWidth}
                onChange={(e) => setBridgeWidth(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-temple">Temple Length (mm)</label>
              <input
                id="prod-temple"
                type="number"
                value={templeLength}
                onChange={(e) => setTempleLength(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-cat">Category</label>
              <select
                id="prod-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className={styles.select}
              >
                <option value={ProductCategory.FRAMES}>Frames</option>
                <option value={ProductCategory.BESPOKE_LENSES}>Bespoke Lenses</option>
                <option value={ProductCategory.ACCESSORIES}>Accessories</option>
                <option value={ProductCategory.CARE_KITS}>Care Kits</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-badge">Badge (Optional)</label>
              <select
                id="prod-badge"
                value={badge}
                onChange={(e) => setBadge(e.target.value as any)}
                className={styles.select}
              >
                <option value="NONE">None</option>
                <option value={ProductBadge.NEW_SEASON}>NEW SEASON</option>
                <option value={ProductBadge.ONLY_2_LEFT}>ONLY 2 LEFT</option>
                <option value={ProductBadge.LIMITED}>LIMITED</option>
                <option value={ProductBadge.IN_STOCK}>IN STOCK</option>
              </select>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? "Creating…" : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
