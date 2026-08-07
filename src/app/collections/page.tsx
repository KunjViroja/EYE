import type { Metadata } from "next";
import { mockProducts } from "@/lib/mockData";
import ProductCard from "@/components/collections/ProductCard";
import shellStyles from "@/components/layout/AppShell.module.css";
import styles from "./CollectionsPage.module.css";
import { Search, SlidersHorizontal, Plus } from "lucide-react";

export const metadata: Metadata = { title: "Collections" };

export default function CollectionsPage() {
  return (
    <div>
      {/* Page Header */}
      <div className={shellStyles.pageHeader}>
        <div className={shellStyles.pageHeaderLeft}>
          <h1 className={shellStyles.pageTitle}>Curated Collections</h1>
          <p className={shellStyles.pageSubtitle}>
            Manage your boutique&apos;s luxury inventory and designer stock.
          </p>
        </div>
        <div className={shellStyles.pageHeaderRight}>
          <button type="button" className={styles.newButton}>
            <Plus size={16} />
            New Creation
          </button>
        </div>
      </div>

      <div className={shellStyles.pageBody}>
        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue}>1,280</span>
            <span className={styles.statLabel}>
              Total Masterpieces <span className={styles.statUnit}>Units</span>
            </span>
          </div>
          <div className={styles.divider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>$842k</span>
            <span className={styles.statLabel}>Portfolio Value</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.stat}>
            <span className={`${styles.statValue} ${styles.statDanger}`}>
              12
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
              id="collections-search"
              aria-label="Search collections"
            />
          </div>
          <button type="button" className={styles.filterButton} id="collections-filter">
            <SlidersHorizontal size={15} />
            Filters
          </button>
        </div>

        {/* Products Grid */}
        <div className={styles.grid}>
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Load More */}
        <div className={styles.loadMore}>
          <button type="button" className={styles.loadMoreButton}>
            DISCOVER MORE CREATIONS
          </button>
        </div>
      </div>
    </div>
  );
}
