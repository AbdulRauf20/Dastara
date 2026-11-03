/**
 * DASTARA shared constants, enums, and presentation metadata.
 * These mirror the PostgreSQL enums defined in the Supabase migrations.
 */

export const siteConfig = {
  name: "DASTARA",
  tagline: "Handmade. Thoughtfully Found.",
  description:
    "DASTARA discovers thoughtfully sourced handmade pieces from local artisans in Pakistan — bringing craftsmanship, culture, and character into everyday life.",
  currency: "PKR",
} as const;

/** Public storefront navigation (never includes an Admin link). */
export const storeNav: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Our Story", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/** Footer policy links. */
export const policyNav: { label: string; href: string }[] = [
  { label: "Shipping & Delivery", href: "/policies/shipping" },
  { label: "Returns & Exchanges", href: "/policies/returns" },
  { label: "Product Care", href: "/policies/care" },
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Terms & Conditions", href: "/policies/terms" },
];

// ---------------------------------------------------------------------------
// Product availability
// ---------------------------------------------------------------------------
export const AVAILABILITY = {
  available: "available",
  sold_out: "sold_out",
  made_to_order: "made_to_order",
  coming_soon: "coming_soon",
  draft: "draft",
  archived: "archived",
} as const;
export type Availability = (typeof AVAILABILITY)[keyof typeof AVAILABILITY];

export const availabilityMeta: Record<
  Availability,
  { label: string; canOrder: boolean; publiclyVisible: boolean; tone: string }
> = {
  available: {
    label: "Available",
    canOrder: true,
    publiclyVisible: true,
    tone: "bg-brand-olive/15 text-brand-olive border-brand-olive/30",
  },
  made_to_order: {
    label: "Made to Order",
    canOrder: true,
    publiclyVisible: true,
    tone: "bg-brand-terracotta/10 text-brand-terracotta border-brand-terracotta/30",
  },
  sold_out: {
    label: "Sold Out",
    canOrder: false,
    publiclyVisible: true,
    tone: "bg-muted text-muted-foreground border-border",
  },
  coming_soon: {
    label: "Coming Soon",
    canOrder: false,
    publiclyVisible: true,
    tone: "bg-brand-ivory text-brand-charcoal border-border",
  },
  draft: {
    label: "Draft",
    canOrder: false,
    publiclyVisible: false,
    tone: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  archived: {
    label: "Archived",
    canOrder: false,
    publiclyVisible: false,
    tone: "bg-muted text-muted-foreground border-border",
  },
};

/** Availabilities that may be shown on the public storefront. */
export const PUBLIC_AVAILABILITIES: Availability[] = (
  Object.keys(availabilityMeta) as Availability[]
).filter((a) => availabilityMeta[a].publiclyVisible);

// ---------------------------------------------------------------------------
// Order status workflow
// ---------------------------------------------------------------------------
export const ORDER_STATUS = {
  inquiry_received: "inquiry_received",
  availability_verification: "availability_verification",
  availability_confirmed: "availability_confirmed",
  awaiting_payment: "awaiting_payment",
  payment_verified: "payment_verified",
  procurement_in_progress: "procurement_in_progress",
  quality_inspection: "quality_inspection",
  packaging: "packaging",
  dispatched: "dispatched",
  delivered: "delivered",
  cancelled: "cancelled",
  refunded: "refunded",
} as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const orderStatusMeta: Record<
  OrderStatus,
  { label: string; step: number; tone: string }
> = {
  inquiry_received: { label: "Inquiry Received", step: 1, tone: "bg-brand-ivory text-brand-charcoal border-border" },
  availability_verification: { label: "Availability Verification", step: 2, tone: "bg-amber-50 text-amber-800 border-amber-200" },
  availability_confirmed: { label: "Availability Confirmed", step: 3, tone: "bg-amber-50 text-amber-800 border-amber-200" },
  awaiting_payment: { label: "Awaiting Payment", step: 4, tone: "bg-orange-50 text-orange-800 border-orange-200" },
  payment_verified: { label: "Payment Verified", step: 5, tone: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  procurement_in_progress: { label: "Procurement in Progress", step: 6, tone: "bg-sky-50 text-sky-800 border-sky-200" },
  quality_inspection: { label: "Quality Inspection", step: 7, tone: "bg-sky-50 text-sky-800 border-sky-200" },
  packaging: { label: "Packaging", step: 8, tone: "bg-sky-50 text-sky-800 border-sky-200" },
  dispatched: { label: "Dispatched", step: 9, tone: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  delivered: { label: "Delivered", step: 10, tone: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  cancelled: { label: "Cancelled", step: 11, tone: "bg-red-50 text-red-800 border-red-200" },
  refunded: { label: "Refunded", step: 12, tone: "bg-red-50 text-red-800 border-red-200" },
};

export const ORDER_STATUS_ORDER: OrderStatus[] = (
  Object.keys(orderStatusMeta) as OrderStatus[]
).sort((a, b) => orderStatusMeta[a].step - orderStatusMeta[b].step);

/**
 * Allowed forward/side transitions. Every status may move to Cancelled.
 * This enforces a controlled workflow and blocks invalid jumps.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  inquiry_received: ["availability_verification", "cancelled"],
  availability_verification: ["availability_confirmed", "cancelled"],
  availability_confirmed: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["payment_verified", "cancelled"],
  payment_verified: ["procurement_in_progress", "refunded", "cancelled"],
  procurement_in_progress: ["quality_inspection", "refunded", "cancelled"],
  quality_inspection: ["packaging", "procurement_in_progress", "refunded", "cancelled"],
  packaging: ["dispatched", "refunded", "cancelled"],
  dispatched: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

/** Statuses that count as a "confirmed order" (past the inquiry stage). */
export const CONFIRMED_ORDER_STATUSES: OrderStatus[] = [
  "availability_confirmed",
  "awaiting_payment",
  "payment_verified",
  "procurement_in_progress",
  "quality_inspection",
  "packaging",
  "dispatched",
  "delivered",
];

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------
export const PAYMENT_STATUS = {
  not_requested: "not_requested",
  awaiting_payment: "awaiting_payment",
  proof_received: "proof_received",
  verified: "verified",
  refunded: "refunded",
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const paymentStatusMeta: Record<
  PaymentStatus,
  { label: string; tone: string }
> = {
  not_requested: { label: "Not Requested", tone: "bg-muted text-muted-foreground border-border" },
  awaiting_payment: { label: "Awaiting Payment", tone: "bg-orange-50 text-orange-800 border-orange-200" },
  proof_received: { label: "Payment Proof Received", tone: "bg-amber-50 text-amber-800 border-amber-200" },
  verified: { label: "Verified", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  refunded: { label: "Refunded", tone: "bg-red-50 text-red-800 border-red-200" },
};

export const PAYMENT_METHOD = {
  bank_transfer: "bank_transfer",
  easypaisa: "easypaisa",
  jazzcash: "jazzcash",
  other: "other",
} as const;
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  bank_transfer: "Bank Transfer",
  easypaisa: "Easypaisa",
  jazzcash: "JazzCash",
  other: "Other",
};

// ---------------------------------------------------------------------------
// Admin roles
// ---------------------------------------------------------------------------
export const ADMIN_ROLE = {
  super_admin: "super_admin",
  admin: "admin",
  editor: "editor",
} as const;
export type AdminRole = (typeof ADMIN_ROLE)[keyof typeof ADMIN_ROLE];

export const adminRoleLabels: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
};

/** Role → capability map, enforced on the server (and mirrored by RLS). */
export const ROLE_CAPABILITIES = {
  super_admin: {
    manageProducts: true,
    manageCategories: true,
    manageOrders: true,
    verifyPayments: true,
    manageSuppliers: true,
    manageCustomers: true,
    manageSettings: true,
    manageAdmins: true,
    viewAnalytics: true,
    viewFinancials: true,
  },
  admin: {
    manageProducts: true,
    manageCategories: true,
    manageOrders: true,
    verifyPayments: true,
    manageSuppliers: true,
    manageCustomers: true,
    manageSettings: false,
    manageAdmins: false,
    viewAnalytics: true,
    viewFinancials: true,
  },
  editor: {
    manageProducts: true,
    manageCategories: true,
    manageOrders: false,
    verifyPayments: false,
    manageSuppliers: false,
    manageCustomers: false,
    manageSettings: false,
    manageAdmins: false,
    viewAnalytics: false,
    viewFinancials: false,
  },
} as const satisfies Record<AdminRole, Record<string, boolean>>;

export type Capability = keyof (typeof ROLE_CAPABILITIES)["super_admin"];

export const SKU_PREFIX = "DAS-P-";
export const ORDER_REF_PREFIX = "DAS-";
