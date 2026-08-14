"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import styles from "./ProductTour.module.css";

interface TourStep {
  targetId: string;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-insights",
    title: "Live Revenue & Insights",
    description:
      "Monitor gross revenue, average sale value, customer footfall, and top eyewear brand mix in real time.",
  },
  {
    targetId: "tour-pos",
    title: "Boutique POS Checkout",
    description:
      "Create instant optical bills, link client optical prescriptions, and process advance or full payments seamlessly.",
  },
  {
    targetId: "tour-collections",
    title: "Frame & Lens Inventory",
    description:
      "Manage designer frames, sunglasses, contact lenses, and accessories with live stock tracking and SKU search.",
  },
  {
    targetId: "tour-clientele",
    title: "Clientele & Optical Rx",
    description:
      "Store client medical notes, lens prescriptions (SPH, CYL, AXIS, ADD), and complete invoice histories.",
  },
  {
    targetId: "tour-settings",
    title: "Store Settings & Taxes",
    description:
      "Configure your store name, GST tax rules, currency symbols, and staff roles whenever you need.",
  },
];

export default function ProductTour() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isTourRequested = searchParams.get("tour") === "true";

  const [active, setActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Check if tour should run on mount
  useEffect(() => {
    if (isTourRequested) {
      setActive(true);
      setCurrentStepIndex(0);
    }
  }, [isTourRequested]);

  // Update target element positioning when step changes
  const updatePosition = useCallback(() => {
    if (!active) return;
    const step = TOUR_STEPS[currentStepIndex];
    if (!step) return;

    const el = document.getElementById(step.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [active, currentStepIndex]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [updatePosition]);

  const closeTour = useCallback(() => {
    setActive(false);
    localStorage.setItem("optipay_tour_completed", "true");
    // Remove ?tour=true from URL without full reload
    if (isTourRequested) {
      router.replace(pathname);
    }
  }, [isTourRequested, pathname, router]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      closeTour();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTour();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, closeTour, currentStepIndex]);

  if (!active) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  // Calculate coordinates for tooltip card
  const pad = 6;
  const spotlightStyle: React.CSSProperties = targetRect
    ? {
        top: Math.max(0, targetRect.top - pad),
        left: Math.max(0, targetRect.left - pad),
        width: targetRect.width + pad * 2,
        height: targetRect.height + pad * 2,
      }
    : { display: "none" };

  const tooltipStyle: React.CSSProperties = targetRect
    ? {
        top: Math.min(
          window.innerHeight - 260,
          Math.max(20, targetRect.top)
        ),
        left: targetRect.right + 20,
      }
    : {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };

  return (
    <div className={styles.overlay} aria-modal="true" role="dialog">
      {/* Spotlight cutout */}
      <div className={styles.spotlightBox} style={spotlightStyle} />

      {/* Floating tooltip */}
      <div className={styles.tooltipCard} style={tooltipStyle}>
        <div className={styles.headerRow}>
          <span className={styles.stepBadge}>
            Step {currentStepIndex + 1} of {TOUR_STEPS.length}
          </span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeTour}
            title="Skip tour (Esc)"
            aria-label="Skip tour"
          >
            <X size={15} />
          </button>
        </div>

        <div>
          <h3 className={styles.title}>{currentStep.title}</h3>
          <p className={styles.description}>{currentStep.description}</p>
        </div>

        <div className={styles.footerRow}>
          <div className={styles.dots}>
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`${styles.dot} ${
                  idx === currentStepIndex ? styles.dotActive : ""
                }`}
              />
            ))}
          </div>

          <div className={styles.btnGroup}>
            {currentStepIndex > 0 && (
              <button
                type="button"
                className={styles.prevBtn}
                onClick={handlePrev}
              >
                <ChevronLeft size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Back
              </button>
            )}
            <button
              type="button"
              className={styles.nextBtn}
              onClick={handleNext}
            >
              {isLast ? (
                <>
                  Done <Check size={14} />
                </>
              ) : (
                <>
                  Next <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
