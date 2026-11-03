import { formatPKR } from "@/lib/utils";
import { toWaNumber } from "@/lib/phone";

export interface OrderMessageInput {
  orderRef: string;
  productSku: string;
  productName: string;
  quantity: number;
  unitPricePaisa: number;
  subtotalPaisa: number;
  deliveryFeePaisa: number;
  totalPaisa: number;
  customerName: string;
  city: string;
  deliveryAddress: string;
  preferredVariant?: string | null;
  specialInstructions?: string | null;
  giftMessage?: string | null;
}

/**
 * Build the human-readable WhatsApp order message from the ACTUAL saved
 * inquiry. All prices come from the server-persisted snapshot, never the
 * browser.
 */
export function buildOrderMessage(input: OrderMessageInput): string {
  const lines: string[] = [
    "Hello DASTARA!",
    "",
    "I would like to place an order.",
    "",
    `Order Reference: ${input.orderRef}`,
    `Product ID: ${input.productSku}`,
    `Product: ${input.productName}`,
    `Quantity: ${input.quantity}`,
    `Unit Price: ${formatPKR(input.unitPricePaisa)}`,
    `Subtotal: ${formatPKR(input.subtotalPaisa)}`,
  ];

  if (input.deliveryFeePaisa > 0) {
    lines.push(`Delivery: ${formatPKR(input.deliveryFeePaisa)}`);
  }
  lines.push(`Estimated Total: ${formatPKR(input.totalPaisa)}`);
  lines.push("");
  lines.push(`Customer Name: ${input.customerName}`);
  lines.push(`City: ${input.city}`);
  lines.push(`Delivery Address: ${input.deliveryAddress}`);

  if (input.preferredVariant) lines.push(`Preferred Colour/Variant: ${input.preferredVariant}`);
  if (input.specialInstructions) lines.push(`Special Instructions: ${input.specialInstructions}`);
  if (input.giftMessage) lines.push(`Gift Message: ${input.giftMessage}`);

  lines.push("");
  lines.push("Please confirm product availability and share the payment details.");
  lines.push("");
  lines.push("Thank you!");

  return lines.join("\n");
}

/** Build an official WhatsApp click-to-chat URL with a prefilled message. */
export function buildWaUrl(businessNumber: string, message: string): string {
  const number = toWaNumber(businessNumber);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Friendly default greeting for the floating button. */
export function buildGreetingUrl(businessNumber: string, greeting?: string): string {
  return buildWaUrl(
    businessNumber,
    greeting ?? "Hello DASTARA! I'd like to know more about your handmade pieces.",
  );
}
