"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}
