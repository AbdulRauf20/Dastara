import type { Capability } from "@/lib/constants";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: string; // lucide icon name
  capability?: Capability;
}

/** Sidebar navigation. `capability` gates visibility per role. */
export const adminNav: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "Products", href: "/admin/products", icon: "Package", capability: "manageProducts" },
  { label: "Categories", href: "/admin/categories", icon: "FolderTree", capability: "manageCategories" },
  { label: "Merchandising", href: "/admin/merchandising", icon: "Sparkles", capability: "manageProducts" },
  { label: "Orders", href: "/admin/orders", icon: "ClipboardList", capability: "manageOrders" },
  { label: "Suppliers", href: "/admin/suppliers", icon: "Truck", capability: "manageSuppliers" },
  { label: "Customers", href: "/admin/customers", icon: "Users", capability: "manageCustomers" },
  { label: "Analytics", href: "/admin/analytics", icon: "BarChart3", capability: "viewAnalytics" },
  { label: "Settings", href: "/admin/settings", icon: "Settings", capability: "manageSettings" },
];
