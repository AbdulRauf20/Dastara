import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "accent" | "success" | "warning";
}) {
  const tones = {
    default: "border-border",
    accent: "border-brand-terracotta/30 bg-brand-terracotta/5",
    success: "border-emerald-200 bg-emerald-50/50",
    warning: "border-orange-200 bg-orange-50/50",
  };
  return (
    <div className={cn("rounded-lg border bg-card p-4", tones[tone])}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-heading text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
