"use client";

import { useState, useEffect } from "react";
import { getProducts } from "@/app/actions/products";
import { getClients } from "@/app/actions/clients";
import { processSaleTransaction } from "@/app/actions/sales";
import styles from "./POSPage.module.css";
import { Search, ShoppingBag, Minus, Plus, Trash2, Sparkles, CreditCard, Building2, Tag, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import EyewearSilhouette from "@/components/ui/EyewearSilhouette";
import { PaymentMethod } from "@prisma/client";

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
}

const CATEGORIES = ["All", "Frames", "Lenses", "Accessories"];

export default function POSPage() {
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [clients, setClients] = useState<POSClientData[]>([]);
  const [selectedClient, setSelectedClient] = useState<POSClientData | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CREDIT_CARD);
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 1. Fetch live products & clients
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      const [prodRes, clientRes] = await Promise.all([
        getProducts(selectedCategory, searchQuery),
        getClients(),
      ]);

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
        const clientList = clientRes.data.map((c) => ({
          id: c.id,
          name: c.name,
          tier: c.tier.replace(/_/g, " "),
          discountRate: 0.1, // 10% member discount
        }));
        setClients(clientList);
        setSelectedClient(clientList[0]);
      }

      setLoading(false);
    }

    loadData();
  }, [selectedCategory, searchQuery]);

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
  };

  // Calculation totals in INR
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountRate = selectedClient ? selectedClient.discountRate : 0;
  const discount = subtotal * discountRate;
  const grandTotal = Math.max(0, subtotal - discount);

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

    const result = await processSaleTransaction({
      clientId: selectedClient.id,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price,
        hasPrescription: item.hasPrescription,
      })),
      paymentMethod,
      subtotal,
      discount,
      grandTotal,
    });

    setProcessing(false);

    if (result.success) {
      setStatusMsg({
        type: "success",
        text: `Transaction #${result.data?.id.slice(-6).toUpperCase()} processed successfully!`,
      });
      setCart([]);
    } else {
      setStatusMsg({ type: "error", text: result.error || "Failed to process transaction." });
    }
  };

  return (
    <div className={styles.layout}>
      {/* Left — Product Selector */}
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
              id="pos-search"
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
                  <EyewearSilhouette color="#C9A96E" size={48} />
                </div>
                <div className={styles.tileBrand}>{p.brand}</div>
                <div className={styles.tileName}>{p.name}</div>
                <div className={styles.tilePrice}>${p.price.toFixed(2)}</div>
              </div>
            ))}

            {/* Consultation Tile */}
            <div
              className={`${styles.productTile} ${styles.productTileDashed}`}
              onClick={() =>
                addToCart({
                  id: "bespoke-consultation-item",
                  brand: "EYE ATELIER",
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
                <Sparkles size={26} color="var(--color-gold)" opacity={0.8} />
              </div>
              <div className={styles.tileConsult}>BESPOKE CONSULTATION ITEM</div>
              <div className={styles.tilePrice} style={{ color: "var(--color-gold-dark)", marginTop: "4px" }}>
                $250.00
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right — Checkout Panel */}
      <div className={styles.right}>
        <div className={styles.checkoutPanel}>
          <div className={styles.checkoutHeader}>
            <h2 className={styles.checkoutTitle}>EYE Checkout</h2>
            <button type="button" className={styles.resetBag} onClick={resetCart}>
              RESET BAG
            </button>
          </div>

          {statusMsg && (
            <div
              className={`${styles.statusBanner} ${
                statusMsg.type === "success" ? styles.statusSuccess : styles.statusError
              }`}
            >
              {statusMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Client Selection */}
          <div className={styles.clientRow} style={{ flexDirection: "column", alignItems: "stretch", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", color: "rgba(255,255,255,0.6)" }}>
                SELECT BUYING CLIENT
              </span>
              {selectedClient && (
                <span className={styles.clientTier}>{selectedClient.tier} (10% Off)</span>
              )}
            </div>

            {clients.length > 0 ? (
              <select
                value={selectedClient?.id || ""}
                onChange={(e) => {
                  const found = clients.find((c) => c.id === e.target.value);
                  if (found) setSelectedClient(found);
                }}
                className={styles.select}
                style={{
                  width: "100%",
                  height: "38px",
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  padding: "0 12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.tier}
                  </option>
                ))}
              </select>
            ) : (
              <div className={styles.clientMeta}>
                <div className={styles.clientName}>No registered clients</div>
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className={styles.cartItems}>
            {cart.length === 0 ? (
              <div className={styles.emptyCart}>
                <ShoppingBag size={32} strokeWidth={1.2} opacity={0.4} />
                <p>Click any product on the left catalog to add to bag.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className={styles.cartItem}>
                  <div className={styles.cartItemImg}>
                    <EyewearSilhouette color="#C9A96E" size={32} />
                  </div>
                  <div className={styles.cartItemInfo}>
                    <div className={styles.cartItemName}>{item.product.name}</div>
                    <div className={styles.cartItemDesc}>{item.product.brand} • ${item.product.price.toFixed(2)}</div>
                    <div className={styles.cartItemControls}>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.product.id, -1)}
                      >
                        <Minus size={12} />
                      </button>
                      <span className={styles.qty}>{item.quantity}</span>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.product.id, 1)}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <div className={styles.cartItemRight}>
                    <span className={styles.cartItemPrice}>
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => removeFromCart(item.product.id)}
                      aria-label="Delete item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.totalRow}>
              <span className={styles.discountLabel}>
                <Tag size={12} /> Member Tier Discount (10%)
              </span>
              <span className={styles.discountValue}>-${discount.toFixed(2)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grandTotalRow}`}>
              <span>Grand Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className={styles.paymentMethods}>
            <button
              type="button"
              className={`${styles.payBtn} ${paymentMethod === PaymentMethod.CREDIT_CARD ? styles.payBtnActive : ""}`}
              onClick={() => setPaymentMethod(PaymentMethod.CREDIT_CARD)}
            >
              <CreditCard size={18} />
              CARD
            </button>
            <button
              type="button"
              className={`${styles.payBtn} ${paymentMethod === PaymentMethod.WIRE_TRANSFER ? styles.payBtnActive : ""}`}
              onClick={() => setPaymentMethod(PaymentMethod.WIRE_TRANSFER)}
            >
              <Building2 size={18} />
              WIRE / UPI
            </button>
          </div>

          {/* Process Button */}
          <button
            type="button"
            className={styles.processBtn}
            onClick={handleProcessTransaction}
            disabled={processing || cart.length === 0}
            id="pos-process-transaction"
          >
            {processing ? "Processing Transaction…" : "Process Transaction"}
          </button>
        </div>
      </div>
    </div>
  );
}
