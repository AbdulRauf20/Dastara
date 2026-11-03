import { availabilityMeta, type Availability } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function AvailabilityBadge({
  availability,
  className,
}: {
  availability: Availability | string;
  className?: string;
}) {
  const meta = availabilityMeta[availability as Availability];
  if (!meta) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.tone,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
