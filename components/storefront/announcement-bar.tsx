export function AnnouncementBar({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <div className="bg-brand-charcoal text-brand-ivory">
      <div className="container py-2 text-center text-xs tracking-wide sm:text-sm">
        {text}
      </div>
    </div>
  );
}
