/**
 * Pakistan phone-number handling.
 * We store numbers in international format without "+" (e.g. 923453412201),
 * which is exactly what the WhatsApp click-to-chat API expects.
 */

/** Normalize a user-entered PK number to `92XXXXXXXXXX`, or null if invalid. */
export function normalizePkPhone(input: string): string | null {
  if (!input) return null;
  let digits = input.replace(/\D/g, "");

  // 00 92 ... -> 92 ...
  if (digits.startsWith("0092")) digits = digits.slice(2);
  // 92XXXXXXXXXX (already international)
  if (digits.startsWith("92") && digits.length === 12) {
    return isValidMobileTail(digits.slice(2)) ? digits : null;
  }
  // 0XXXXXXXXXX (local, 11 digits)
  if (digits.startsWith("0") && digits.length === 11) {
    const tail = digits.slice(1);
    return isValidMobileTail(tail) ? `92${tail}` : null;
  }
  // XXXXXXXXXX (10 digits, missing leading 0)
  if (digits.length === 10) {
    return isValidMobileTail(digits) ? `92${digits}` : null;
  }
  return null;
}

/** PK mobile numbers: 10 digits beginning with 3 (e.g. 3xx xxxxxxx). */
function isValidMobileTail(tail: string): boolean {
  return /^3\d{9}$/.test(tail);
}

/** Pretty local display, e.g. 0345 3412201. */
export function formatPkPhoneDisplay(intl: string | null | undefined): string {
  if (!intl) return "—";
  const digits = intl.replace(/\D/g, "");
  const tail = digits.startsWith("92") ? digits.slice(2) : digits.replace(/^0/, "");
  if (tail.length !== 10) return intl;
  return `0${tail.slice(0, 3)} ${tail.slice(3)}`;
}

/** For wa.me links: digits only, no "+". */
export function toWaNumber(input: string): string {
  return input.replace(/\D/g, "");
}
