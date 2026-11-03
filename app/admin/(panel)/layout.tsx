import type { Metadata } from "next";
import { requireAdmin, roleCan } from "@/lib/auth/guards";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { adminNav } from "@/components/admin/nav-items";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — DASTARA Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const role = session.profile.role;

  // Only show nav the role is allowed to use (defense-in-depth with RLS).
  const items = adminNav.filter(
    (item) => !item.capability || roleCan(role, item.capability),
  );

  return (
    <div className="admin-shell min-h-screen bg-background md:flex">
      <AdminSidebar items={items} role={role} email={session.email} />
      <div className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
