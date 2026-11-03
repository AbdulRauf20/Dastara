import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-beige px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="wordmark text-2xl">DASTARA</p>
          <p className="mt-2 text-sm text-muted-foreground">Admin Console</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h1 className="mb-1 font-heading text-xl font-semibold">Sign in</h1>
          <p className="mb-5 text-sm text-muted-foreground">
            Authorized staff only. All actions are logged.
          </p>
          <LoginForm redirectTo={redirect} />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Protected area. If you&apos;re a customer, head back to the{" "}
          <Link href="/" className="underline">
            store
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
