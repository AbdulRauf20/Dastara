"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/** Fire-and-forget product view counter (honest analytics, best effort). */
export function ViewTracker({ productId }: { productId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const key = `dastara:viewed:${productId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore storage errors */
    }
    const supabase = createClient();
    supabase.rpc("increment_product_view", { p_product_id: productId }).then(
      () => undefined,
      () => undefined,
    );
  }, [productId]);

  return null;
}
