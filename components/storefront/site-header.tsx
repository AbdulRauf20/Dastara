"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { storeNav } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/types/database";

export function SiteHeader({ categories }: { categories: CategoryRow[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Mobile menu */}
        <div className="flex items-center md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-secondary"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="wordmark text-lg">DASTARA</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-1">
                {storeNav.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-md px-3 py-2.5 text-base font-medium hover:bg-secondary"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              {categories.length > 0 && (
                <div className="mt-6 border-t border-border pt-6">
                  <p className="eyebrow mb-3">Collections</p>
                  <div className="flex flex-col gap-1">
                    {categories.map((c) => (
                      <SheetClose asChild key={c.id}>
                        <Link
                          href={`/shop?category=${c.slug}`}
                          className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          {c.name}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>

        {/* Wordmark */}
        <Link href="/" className="wordmark text-xl sm:text-2xl md:flex-none">
          DASTARA
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {storeNav.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium tracking-wide transition-colors hover:text-brand-terracotta",
                  active ? "text-brand-terracotta" : "text-foreground/80",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Search shortcut */}
        <div className="flex items-center justify-end">
          <Link
            href="/shop"
            aria-label="Search the shop"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-secondary"
          >
            <Search className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
