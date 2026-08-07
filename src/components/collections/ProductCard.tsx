import type { Product } from "@/lib/mockData";
import styles from "./ProductCard.module.css";

interface Props {
  product: Product;
}

// Map badge text to CSS class
const BADGE_CLASSES: Record<string, string> = {
  "NEW SEASON": styles.badgeNew,
  "ONLY 2 LEFT": styles.badgeLow,
  LIMITED: styles.badgeLimited,
  "IN STOCK": styles.badgeInStock,
};

// Emoji stand-in for missing product images
const BRAND_EMOJI: Record<string, string> = {
  "OLIVER PEOPLES": "🕶️",
  CARTIER: "💛",
  "TOM FORD": "🌹",
  PRADA: "⚡",
  GUCCI: "🌿",
  "RAY-BAN": "☀️",
};

export default function ProductCard({ product }: Props) {
  return (
    <article className={styles.card} aria-label={`${product.brand} ${product.name}`}>
      {/* Image / placeholder area */}
      <div className={styles.imageWrap}>
        <div className={styles.imagePlaceholder} aria-hidden="true">
          {BRAND_EMOJI[product.brand] ?? "🕶️"}
        </div>

        {/* Badge — only rendered if product has one */}
        {product.badge && (
          <span className={`${styles.badge} ${BADGE_CLASSES[product.badge]}`}>
            {product.badge}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.brand}>{product.brand}</span>
          <span className={styles.sku}>SKU: {product.sku}</span>
        </div>
        <h3 className={styles.productName}>{product.name}</h3>
      </div>
    </article>
  );
}
