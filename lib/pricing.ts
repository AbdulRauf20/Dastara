/**
 * Pricing math. All amounts are integer paisa — never floating point.
 * The server is the single source of truth for prices; the browser's numbers
 * are ignored entirely.
 */

export interface OrderTotals {
  unitPricePaisa: number;
  quantity: number;
  subtotalPaisa: number;
  deliveryFeePaisa: number;
  totalPaisa: number;
}

/**
 * Compute order totals from the authoritative unit price and the store's
 * delivery settings. Delivery can be waived above a configured threshold.
 */
export function computeOrderTotals(params: {
  unitPricePaisa: number;
  quantity: number;
  deliveryFeePaisa: number;
  freeDeliveryThresholdPaisa?: number | null;
}): OrderTotals {
  const quantity = Math.max(1, Math.floor(params.quantity));
  const unitPricePaisa = Math.max(0, Math.floor(params.unitPricePaisa));
  const subtotalPaisa = unitPricePaisa * quantity;

  let deliveryFeePaisa = Math.max(0, Math.floor(params.deliveryFeePaisa));
  const threshold = params.freeDeliveryThresholdPaisa ?? null;
  if (threshold !== null && threshold > 0 && subtotalPaisa >= threshold) {
    deliveryFeePaisa = 0;
  }

  return {
    unitPricePaisa,
    quantity,
    subtotalPaisa,
    deliveryFeePaisa,
    totalPaisa: subtotalPaisa + deliveryFeePaisa,
  };
}

/** Discount percentage for display when an original (compare-at) price exists. */
export function discountPercent(
  pricePaisa: number,
  originalPricePaisa: number | null | undefined,
): number | null {
  if (!originalPricePaisa || originalPricePaisa <= pricePaisa) return null;
  return Math.round(((originalPricePaisa - pricePaisa) / originalPricePaisa) * 100);
}

/** Estimated margin (admin only). Returns null when cost data is incomplete. */
export function estimatedMarginPaisa(params: {
  pricePaisa: number;
  supplierCostPaisa?: number | null;
  packagingCostPaisa?: number | null;
  deliveryCostPaisa?: number | null;
}): number | null {
  if (params.supplierCostPaisa === null || params.supplierCostPaisa === undefined) {
    return null;
  }
  const costs =
    (params.supplierCostPaisa ?? 0) +
    (params.packagingCostPaisa ?? 0) +
    (params.deliveryCostPaisa ?? 0);
  return params.pricePaisa - costs;
}
