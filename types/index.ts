import type {
  ProductRow,
  ProductImageRow,
  CategoryRow,
  OrderInquiryRow,
  OrderItemRow,
  PaymentRow,
  OrderStatusHistoryRow,
} from "@/types/database";

/** A product with its embedded images and category (public-safe fields only). */
export interface ProductWithRelations extends ProductRow {
  images: ProductImageRow[];
  category: Pick<CategoryRow, "id" | "name" | "slug"> | null;
}

export interface ProductListItem extends ProductRow {
  images: ProductImageRow[];
  category: Pick<CategoryRow, "id" | "name" | "slug"> | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export type ProductSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popular";

export interface ProductFilters {
  q?: string;
  categorySlug?: string;
  minPaisa?: number;
  maxPaisa?: number;
  availability?: string[];
  sort?: ProductSort;
  page?: number;
  perPage?: number;
  includeSoldOut?: boolean;
}

/** Full inquiry detail used in the admin order drawer. */
export interface InquiryDetail extends OrderInquiryRow {
  items: OrderItemRow[];
  payments: PaymentRow[];
  history: OrderStatusHistoryRow[];
}
