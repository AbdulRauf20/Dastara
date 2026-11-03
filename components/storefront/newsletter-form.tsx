"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { subscribeNewsletter } from "@/app/actions/newsletter";

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeNewsletter, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Subscribed.");
      formRef.current?.reset();
    } else {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex w-full max-w-md gap-2">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      <Input
        type="email"
        name="email"
        required
        placeholder="Your email address"
        aria-label="Email address"
        className="bg-card"
      />
      <Button type="submit" disabled={pending} variant="accent">
        {pending ? "…" : "Subscribe"}
      </Button>
    </form>
  );
}
