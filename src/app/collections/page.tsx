"use client";

import { useState, useEffect, useCallback } from "react";
import { getProducts } from "@/app/actions/products";
import { getPurchaseLogs, PurchaseLogItem } from "@/app/actions/purchases";
import ProductCard, { ProductItem } from "@/components/collections/ProductCard";
import AddProductAndPurchaseModal from "@/components/collections/AddProductAndPurchaseModal";
import shellStyles from "@/components/layout/AppShell.module.css";
import styles from "./CollectionsPage.module.css";
import { Search, Plus, RefreshCw, ShoppingBag, Glasses, Disc, Package } from "lucide-react";
import { saasConfig } from "@/config/saasConfig";

type CategoryTab = "All" | "Frames" | "Lenses" | "Accessories";

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [purchaseLogs, setPurchaseLogs] = useState<PurchaseLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<CategoryTab>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Merged Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchInventoryData = useCallback(async () => {
    setLoading(true);

    const mappedCategory =
      activeTab === "Frames"
        ? "FRAMES"
        : activeTab === "Lenses"
        ? "BESPOKE_LENSES"
        : activeTab === "Accessories"
        ? "ACCESSORIES"
        : "All";

    const res = await getProducts(mappedCategory, searchQuery);
    if (res.success && res.data) {
      const mapped: ProductItem[] = res.data.map((p: typeof res.data[0]) => ({
        id: p.id,
        brand: p.brand,
        name: p.name,
        sku: p.sku,
        price: p.price,
        imageUrl: p.imageUrl || "/products/default.jpg",
        badge: p.badge ? p.badge.replace("_", " ") : undefined,
        category: p.category === "BESPOKE_LENSES" ? "Bespoke Lenses" : p.category === "ACCESSORIES" ? "Accessories" : "Frames",
      }));
      setProducts(mapped);
    }

    const purchasesRes = await getPurchaseLogs();
    if (purchasesRes.success && purchasesRes.data) {
      setPurchaseLogs(purchasesRes.data);
    }

    setLoading(false);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  const totalValue = products.reduce((sum, p) => sum + p.price, 0);

  return (
    <div>
      {/* Page Header */}
      <div className={shellStyles.pageHeader}>
        <div className={shellStyles.pageHeaderLeft}>
          <h1 className={shellStyles.pageTitle}>Inventory Management</h1>
          <p className={shellStyles.pageSubtitle}>
            Manage frames, bespoke lenses, accessories, and log vendor purchases for {saasConfig.storeName}.
          </p>
        </div>
        <div className={shellStyles.pageHeaderRight} style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className={styles.newButton}
            onClick={() => setIsAddModalOpen(true)}
            style={{ background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)", color: "#0b0f19", fontWeight: 700 }}
          >
            <Plus size={16} />
            Add Product & Purchase
          </button>
        </div>
      </div>

      <div className={shellStyles.pageBody}>
        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{products.length.toLocaleString()}</span>
            <span className={styles.statLabel}>Total Inventory Items</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {saasConfig.currency}{totalValue > 0 ? (totalValue > 1000 ? `${(totalValue / 1000).toFixed(1)}k` : totalValue) : "0"}
            </span>
            <span className={styles.statLabel}>Inventory Valuation</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{purchaseLogs.length}</span>
            <span className={styles.statLabel}>Purchase Orders Logged</span>
          </div>
        </div>

        {/* Category Tabs Switcher */}
        <div style={{ display: "flex", gap: "10px", margin: "1.25rem 0", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px" }}>
          {[
            { id: "All", label: "All Items", icon: Package },
            { id: "Frames", label: "Eyewear Frames", icon: Glasses },
            { id: "Lenses", label: "Bespoke Lenses", icon: Disc },
            { id: "Accessories", label: "Accessories & Kits", icon: ShoppingBag },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as CategoryTab)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: isActive ? "1px solid rgba(212, 175, 55, 0.5)" : "1px solid transparent",
                  background: isActive ? "rgba(212, 175, 55, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  color: isActive ? "#d4af37" : "#94a3b8",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search + Filter */}
        <div className={styles.searchRow}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Search by brand, SKU, frame model, or lens coating..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="button" className={styles.filterButton} onClick={fetchInventoryData}>
            <RefreshCw size={15} className={loading ? styles.spin : ""} />
            Refresh
          </button>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className={styles.loadingState}>
            <RefreshCw size={24} className={styles.spin} />
            <span>Fetching catalog items…</span>
          </div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No inventory items match your tab or search filter.</p>
            <button type="button" className={styles.newButton} onClick={() => setIsAddModalOpen(true)}>
              + Add First Item
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Merged Product Creation & Purchase Order Modal */}
      <AddProductAndPurchaseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        products={products}
        onSuccess={fetchInventoryData}
      />
    </div>
  );
}
