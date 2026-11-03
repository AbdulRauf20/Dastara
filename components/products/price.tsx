import { formatPKR, cn } from "@/lib/utils";
import { discountPercent } from "@/lib/pricing";

export function Price({
  pricePaisa,
  originalPricePaisa,
  className,
  size = "md",
}: {
  pricePaisa: number;
  originalPricePaisa?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pct = discountPercent(pricePaisa, originalPricePaisa);
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  };
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-medium text-foreground", sizes[size])}>
        {formatPKR(pricePaisa)}
      </span>
      {pct !== null && (
        <>
          <span className="text-sm text-muted-foreground line-through">
            {formatPKR(originalPricePaisa)}
          </span>
          <span className="text-xs font-medium text-brand-terracotta">-{pct}%</span>
        </>
      )}
    </div>
  );
}
