import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  hrefLabel = "View all",
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center text-center",
        className,
      )}
    >
      <div className={cn("space-y-2", align === "center" && "max-w-2xl")}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="max-w-prose text-muted-foreground">{description}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-brand-terracotta hover:underline"
        >
          {hrefLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
