"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Sparkles,
  ClipboardList,
  Truck,
  Users,
  BarChart3,
  Settings,
  Menu,
  ExternalLink,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { LogoutButton } from "@/components/admin/logout-button";
import { adminRoleLabels, type AdminRole } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AdminNavItem } from "@/components/admin/nav-items";

const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard,
  Package,
  FolderTree,
  Sparkles,
  ClipboardList,
  Truck,
  Users,
  BarChart3,
  Settings,
};

function NavLinks({ items, onNavigate }: { items: AdminNavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.icon] ?? LayoutDashboard;
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-charcoal text-brand-ivory"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarInner({
  items,
  role,
  email,
  onNavigate,
}: {
  items: AdminNavItem[];
  role: AdminRole;
  email: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-5">
        <Link href="/admin" className="wordmark text-lg" onClick={onNavigate}>
          DASTARA
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">Admin Console</p>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <NavLinks items={items} onNavigate={onNavigate} />
      </div>
      <Separator />
      <div className="space-y-2 px-3 py-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          View store
        </Link>
        <LogoutButton />
        <div className="rounded-md bg-secondary/60 px-3 py-2">
          <p className="truncate text-xs font-medium">{email}</p>
          <p className="text-xs text-muted-foreground">{adminRoleLabels[role]}</p>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({
  items,
  role,
  email,
}: {
  items: AdminNavItem[];
  role: AdminRole;
  email: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block">
        <div className="sticky top-0 h-screen">
          <SidebarInner items={items} role={role} email={email} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <Link href="/admin" className="wordmark text-base">
          DASTARA
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-secondary"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <SidebarInner
              items={items}
              role={role}
              email={email}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
