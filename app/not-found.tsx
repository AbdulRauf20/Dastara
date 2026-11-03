import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-5 text-center">
      <p className="wordmark text-lg text-brand-terracotta">DASTARA</p>
      <h1 className="font-heading text-5xl font-semibold">Page not found</h1>
      <p className="max-w-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Back home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/shop">Browse the shop</Link>
        </Button>
      </div>
    </div>
  );
}
