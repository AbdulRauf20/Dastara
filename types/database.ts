/**
 * Hand-maintained Supabase schema types for DASTARA.
 * Kept in sync with supabase/migrations/*.sql.
 *
 * NOTE: Row types are `type` aliases (not interfaces) on purpose — object
 * `type` aliases gain an implicit index signature and therefore satisfy
 * supabase-js's `GenericSchema` constraint. Interfaces would make the typed
 * client resolve every query to `never`.
 */

export type AdminRole = "super_admin" | "admin" | "editor";

export type ProductAvailability =
  | "available"
  | "sold_out"
  | "made_to_order"
  | "coming_soon"
  | "draft"
  | "archived";

export type OrderStatus =
  | "inquiry_received"
  | "availability_verification"
  | "availability_confirmed"
  | "awaiting_payment"
  | "payment_verified"
  | "procurement_in_progress"
  | "quality_inspection"
  | "packaging"
  | "dispatched"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "not_requested"
  | "awaiting_payment"
  | "proof_received"
  | "verified"
  | "refunded";

export type PaymentMethod = "bank_transfer" | "easypaisa" | "jazzcash" | "other";

type Timestamps = { created_at: string; updated_at: string };

export type AdminProfileRow = Timestamps & {
  id: string;
  email: string;
  full_name: string | null;
  role: AdminRole;
  is_active: boolean;
};

export type CategoryRow = Timestamps & {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  display_order: number;
  is_visible: boolean;
  is_archived: boolean;
};

export type ProductRow = Timestamps & {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string | null;
  availability: ProductAvailability;
  is_published: boolean;
  price_paisa: number;
  original_price_paisa: number | null;
  currency: string;
  material: string | null;
  dimensions: string | null;
  color: string | null;
  care_instructions: string | null;
  origin_note: string | null;
  origin_verified: boolean;
  is_trending: boolean;
  trending_order: number | null;
  is_featured: boolean;
  featured_order: number | null;
  is_new_arrival: boolean;
  new_arrival_order: number | null;
  display_order: number;
  view_count: number;
  inquiry_count: number;
  published_at: string | null;
};

export type ProductPrivateRow = {
  product_id: string;
  supplier_cost_paisa: number | null;
  packaging_cost_paisa: number | null;
  delivery_cost_paisa: number | null;
  internal_notes: string | null;
  updated_at: string;
};

export type ProductImageRow = {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
};

export type SupplierRow = Timestamps & {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  notes: string | null;
  is_active: boolean;
};

export type ProductSupplierRow = Timestamps & {
  id: string;
  product_id: string;
  supplier_id: string;
  supplier_price_paisa: number | null;
  is_available: boolean;
  lead_time_days: number | null;
  notes: string | null;
};

export type CustomerRow = Timestamps & {
  id: string;
  full_name: string;
  phone: string;
  phone_raw: string | null;
  email: string | null;
  city: string | null;
};

export type OrderInquiryRow = Timestamps & {
  id: string;
  order_ref: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  city: string;
  delivery_address: string;
  preferred_variant: string | null;
  special_instructions: string | null;
  gift_message: string | null;
  subtotal_paisa: number;
  delivery_fee_paisa: number;
  total_paisa: number;
  currency: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  admin_notes: string | null;
  source: string;
  ip_hash: string | null;
};

export type OrderItemRow = {
  id: string;
  inquiry_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string;
  unit_price_paisa: number;
  quantity: number;
  line_total_paisa: number;
  image_path: string | null;
  created_at: string;
};

export type OrderStatusHistoryRow = {
  id: string;
  inquiry_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  note: string | null;
  changed_by: string | null;
  changed_by_email: string | null;
  created_at: string;
};

export type PaymentRow = Timestamps & {
  id: string;
  inquiry_id: string;
  amount_paisa: number;
  method: PaymentMethod | null;
  status: PaymentStatus;
  transaction_ref: string | null;
  proof_path: string | null;
  payment_date: string | null;
  verified_at: string | null;
  verified_by: string | null;
  notes: string | null;
};

export type SiteSettingsRow = {
  id: number;
  whatsapp_number: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  announcement_text: string | null;
  announcement_enabled: boolean;
  hero_headline: string | null;
  hero_subtext: string | null;
  hero_cta_label: string | null;
  hero_cta_href: string | null;
  hero_image_path: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_tiktok: string | null;
  delivery_fee_paisa: number;
  delivery_estimate: string | null;
  free_delivery_threshold_paisa: number | null;
  footer_about: string | null;
  trending_enabled: boolean;
  trending_max: number;
  featured_enabled: boolean;
  new_arrivals_enabled: boolean;
  show_sold_out: boolean;
  sections: Record<string, { enabled: boolean; order: number }>;
  policies: Record<string, string>;
  updated_at: string;
  updated_by: string | null;
};

export type PaymentConfigRow = {
  id: number;
  payment_instructions: string | null;
  bank_details: string | null;
  easypaisa_details: string | null;
  jazzcash_details: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type NewsletterSubscriberRow = {
  id: string;
  email: string;
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

/** Helper to build a Supabase table definition with sensible Insert/Update. */
type TableDef<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      admin_profiles: TableDef<AdminProfileRow>;
      categories: TableDef<CategoryRow>;
      products: TableDef<ProductRow>;
      product_private: TableDef<ProductPrivateRow>;
      product_images: TableDef<ProductImageRow>;
      suppliers: TableDef<SupplierRow>;
      product_suppliers: TableDef<ProductSupplierRow>;
      customers: TableDef<CustomerRow>;
      order_inquiries: TableDef<OrderInquiryRow>;
      order_items: TableDef<OrderItemRow>;
      order_status_history: TableDef<OrderStatusHistoryRow>;
      payments: TableDef<PaymentRow>;
      site_settings: TableDef<SiteSettingsRow>;
      payment_config: TableDef<PaymentConfigRow>;
      newsletter_subscribers: TableDef<NewsletterSubscriberRow>;
      audit_logs: TableDef<AuditLogRow>;
    };
    Views: Record<string, never>;
    Functions: {
      increment_product_view: {
        Args: { p_product_id: string };
        Returns: undefined;
      };
      increment_product_inquiry: {
        Args: { p_product_id: string };
        Returns: undefined;
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
      can_manage_operations: { Args: Record<string, never>; Returns: boolean };
      current_admin_role: { Args: Record<string, never>; Returns: AdminRole };
    };
    Enums: {
      admin_role: AdminRole;
      product_availability: ProductAvailability;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
    };
    CompositeTypes: Record<string, never>;
  };
};
