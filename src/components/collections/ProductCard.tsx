import styles from "./ProductCard.module.css";
import EyewearSilhouette from "@/components/ui/EyewearSilhouette";

export interface ProductItem {
  id: string;
  brand: string;
  name: string;
  sku: string;
  price: number;
  imageUrl?: string;
  badge?: string;
  category?: string;
}

interface Props { product: ProductItem }

const BADGE_CLASSES: Record<string, string> = {
  "NEW SEASON": styles.badgeNew,
  "ONLY 2 LEFT": styles.badgeLow,
  "LIMITED":    styles.badgeLimited,
  "IN STOCK":   styles.badgeInStock,
};

const BRAND_COLORS: Record<string, string> = {
  "OLIVER PEOPLES": "#C9A96E",
  "CARTIER":        "#D4A853",
  "TOM FORD":       "#8B7355",
  "PRADA":          "#6B7280",
  "GUCCI":          "#4B5563",
  "RAY-BAN":        "#C9A96E",
};

export default function ProductCard({ product }: Props) {
  const silhouetteColor = BRAND_COLORS[product.brand] ?? "#C9A96E";

  return (
    <article className={styles.card} aria-label={`${product.brand} ${product.name}`}>
      <div className={styles.imageWrap}>
        <div className={styles.silhouette}>
          <EyewearSilhouette color={silhouetteColor} size={64} />
        </div>

        {product.badge && (
          <span className={`${styles.badge} ${BADGE_CLASSES[product.badge] || styles.badgeNew}`}>
            {product.badge}
          </span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.brand}>{product.brand}</span>
          <span className={styles.sku}>SKU: {product.sku}</span>
        </div>
        <h3 className={styles.productName}>{product.name}</h3>
        <div className={styles.price}>${product.price.toLocaleString()}</div>
      </div>
    </article>
  );
}
