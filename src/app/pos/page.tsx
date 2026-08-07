import type { Metadata } from "next";
import { mockProducts, mockClients } from "@/lib/mockData";
import shellStyles from "@/components/layout/AppShell.module.css";
import styles from "./POSPage.module.css";
import { Search, ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";

export const metadata: Metadata = { title: "Boutique POS" };

// Mock cart state (in Phase 2 this will be real React state via useState)
const cartItems = [
  { id: "cart-1", name: "Gregory Peck Custom", desc: "Vintage Gold / Clear Acetate", price: 340, qty: 1, hasPrescription: true },
  { id: "cart-2", name: "Zeiss Bespoke Progressive", desc: "DuraVision BlueProtect Elite", price: 220, qty: 1, hasPrescription: false },
];

const selectedClient = mockClients[1]; // Sofia Jensen
const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
const discount = subtotal * 0.1;
const grandTotal = subtotal - discount;

const CATEGORIES = ["All", "Frames", "Lenses", "Accessories"];

export default function POSPage() {
  return (
    <div className={styles.layout}>
      {/* Left — Product Selector */}
      <div className={styles.left}>
        {/* Search bar */}
        <div className={styles.searchRow}>
          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Search collection, brand or model..."
              className={styles.searchInput}
              id="pos-search"
            />
          </div>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.catTab} ${cat === "All" ? styles.catTabActive : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className={styles.productGrid}>
          {mockProducts.slice(0, 3).map((p) => (
            <div key={p.id} className={styles.productTile}>
              {p.badge && (
                <span className={`${styles.tileBadge} ${p.badge === "IN STOCK" ? styles.tileBadgeGreen : styles.tileBadgeGold}`}>
                  {p.badge}
                </span>
              )}
              <div className={styles.tileEmoji}>🕶️</div>
              <div className={styles.tileBrand}>{p.brand}</div>
              <div className={styles.tileName}>{p.name}</div>
            </div>
          ))}

          {/* Bespoke consultation item */}
          <div className={`${styles.productTile} ${styles.productTileDashed}`}>
            <div className={styles.tileEmoji} style={{ fontSize: 24, opacity: 0.3 }}>✨</div>
            <div className={styles.tileConsult}>BESPOKE CONSULTATION ITEM</div>
          </div>
        </div>
      </div>

      {/* Right — Checkout Panel */}
      <div className={styles.right}>
        <div className={styles.checkoutPanel}>
          <div className={styles.checkoutHeader}>
            <h2 className={styles.checkoutTitle}>Atelier Checkout</h2>
            <button type="button" className={styles.resetBag}>RESET BAG</button>
          </div>

          {/* Client */}
          <div className={styles.clientRow}>
            <div className={styles.clientAvatar}>SJ</div>
            <div>
              <div className={styles.clientName}>{selectedClient.name}</div>
              <div className={styles.clientTier}>{selectedClient.tier}</div>
            </div>
            <span className={styles.chevron}>›</span>
          </div>

          {/* Cart Items */}
          <div className={styles.cartItems}>
            {cartItems.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.cartItemImg}>🕶️</div>
                <div className={styles.cartItemInfo}>
                  <div className={styles.cartItemName}>{item.name}</div>
                  <div className={styles.cartItemDesc}>{item.desc}</div>
                  <div className={styles.cartItemControls}>
                    <button type="button" className={styles.qtyBtn}><Minus size={12} /></button>
                    <span className={styles.qty}>{item.qty}</span>
                    <button type="button" className={styles.qtyBtn}><Plus size={12} /></button>
                    {item.hasPrescription && (
                      <span className={styles.rxBadge}>PRESCRIPTION APPLIED</span>
                    )}
                  </div>
                </div>
                <div className={styles.cartItemRight}>
                  <span className={styles.cartItemPrice}>${item.price.toFixed(2)}</span>
                  <button type="button" className={styles.deleteBtn}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Boutique Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.totalRow}>
              <span className={styles.discountLabel}>Atelier Member Discount 🏷️</span>
              <span className={styles.discountValue}>-${discount.toFixed(2)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grandTotalRow}`}>
              <span>Grand Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className={styles.paymentMethods}>
            <button type="button" className={`${styles.payBtn} ${styles.payBtnActive}`}>
              <ShoppingBag size={18} />
              DEBIT/CREDIT
            </button>
            <button type="button" className={styles.payBtn}>
              🏦 WIRE TRANSFER
            </button>
          </div>

          {/* Process Button */}
          <button type="button" className={styles.processBtn} id="pos-process-transaction">
            Process Transaction
          </button>
        </div>
      </div>
    </div>
  );
}
