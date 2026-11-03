/** Standard discriminated result returned by server actions used with forms. */
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function ok<T>(data?: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Convert a ZodError's flatten() output to our fieldErrors shape. */
export function zodFieldErrors(
  flattened: { fieldErrors: Record<string, string[] | undefined> },
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(flattened.fieldErrors)) {
    if (v && v.length) out[k] = v;
  }
  return out;
}
