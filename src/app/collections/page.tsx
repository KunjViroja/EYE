"use client";

import { useState, useEffect, useCallback } from "react";
import { getProducts } from "@/app/actions/products";
import ProductCard from "@/components/collections/ProductCard";
import NewProductModal from "@/components/collections/NewProductModal";
import shellStyles from "@/components/layout/AppShell.module.css";
import styles from "./CollectionsPage.module.css";
import { Search, SlidersHorizontal, Plus, RefreshCw } from "lucide-react";
import type { Product } from "@/lib/mockData";

export default function CollectionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLiveProducts = useCallback(async () => {
    setLoading(true);
    const res = await getProducts("All", searchQuery);
    if (res.success && res.data) {
      // Map Prisma model shape to UI Product shape
      const mapped: Product[] = res.data.map((p) => ({
        id: p.id,
        brand: p.brand,
        name: p.name,
        sku: p.sku,
        price: p.price,
        imageUrl: p.imageUrl || "/products/default.jpg",
        badge: (p.badge ? p.badge.replace("_", " ") : undefined) as any,
        category: "Frames",
      }));
      setProducts(mapped);
    }
    setLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    fetchLiveProducts();
  }, [fetchLiveProducts]);

  const totalValue = products.reduce((sum, p) => sum + p.price, 0);
  const lowStockCount = products.filter((p) => p.badge === ("ONLY 2 LEFT" as any)).length;

  return (
    <div>
      {/* Page Header */}
      <div className={shellStyles.pageHeader}>
        <div className={shellStyles.pageHeaderLeft}>
          <h1 className={shellStyles.pageTitle}>Curated Collections</h1>
          <p className={shellStyles.pageSubtitle}>
            Manage your boutique&apos;s luxury inventory and designer stock live in Supabase.
          </p>
        </div>
        <div className={shellStyles.pageHeaderRight}>
          <button
            type="button"
            className={styles.newButton}
            onClick={() => setIsModalOpen(true)}
            id="collections-new-creation"
          >
            <Plus size={16} />
            New Creation
          </button>
        </div>
      </div>

      <div className={shellStyles.pageBody}>
        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{products.length.toLocaleString()}</span>
            <span className={styles.statLabel}>
              Total Masterpieces <span className={styles.statUnit}>Units</span>
            </span>
          </div>
          <div className={styles.divider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>
              ${totalValue > 0 ? (totalValue > 1000 ? `${(totalValue / 1000).toFixed(1)}k` : totalValue) : "0"}
            </span>
            <span className={styles.statLabel}>Portfolio Value</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.stat}>
            <span className={`${styles.statValue} ${styles.statDanger}`}>
              {lowStockCount}
            </span>
            <span className={styles.statLabel}>
              Awaiting Curation <span className={styles.statLow}>Low stock</span>
            </span>
          </div>
        </div>

        {/* Search + Filter */}
        <div className={styles.searchRow}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Search by brand, color, or model..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="collections-search"
              aria-label="Search collections"
            />
          </div>
          <button type="button" className={styles.filterButton} onClick={fetchLiveProducts}>
            <RefreshCw size={15} className={loading ? styles.spin : ""} />
            Refresh
          </button>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className={styles.loadingState}>
            <RefreshCw size={24} className={styles.spin} />
            <span>Fetching live creations from Supabase…</span>
          </div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No creations match your search.</p>
            <button type="button" className={styles.newButton} onClick={() => setIsModalOpen(true)}>
              + Add First Creation
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

      {/* New Creation Modal */}
      <NewProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchLiveProducts}
      />
    </div>
  );
}
