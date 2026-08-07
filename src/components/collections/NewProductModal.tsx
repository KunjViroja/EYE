"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";
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
  const [category, setCategory] = useState<ProductCategory>(ProductCategory.FRAMES);
  const [badge, setBadge] = useState<ProductBadge | "NONE">("NONE");
  const [stock, setStock] = useState("10");

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
      category,
      badge: badge === "NONE" ? null : badge,
      stock: Number(stock),
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to create product.");
      return;
    }

    // Reset form
    setBrand("");
    setName("");
    setSku("");
    setPrice("");
    setBadge("NONE");
    onSuccess();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose} aria-modal="true" role="dialog">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>New Atelier Creation</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-brand">Brand Name</label>
              <input
                id="prod-brand"
                type="text"
                required
                placeholder="e.g. CARTIER"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-sku">SKU Code</label>
              <input
                id="prod-sku"
                type="text"
                required
                placeholder="e.g. CR-PN-99"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="prod-name">Creation Name</label>
            <input
              id="prod-name"
              type="text"
              required
              placeholder="e.g. Panthère Edition Gold"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-price">Retail Price ($)</label>
              <input
                id="prod-price"
                type="number"
                step="0.01"
                required
                placeholder="750.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-stock">Initial Stock</label>
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
                <option value={ProductCategory.LENSES}>Lenses</option>
                <option value={ProductCategory.ACCESSORIES}>Accessories</option>
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
              {loading ? "Creating…" : "Save Creation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
