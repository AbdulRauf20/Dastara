import { z } from "zod";
import { PAYMENT_METHOD, PAYMENT_STATUS, ORDER_STATUS } from "@/lib/constants";

const methodValues = Object.values(PAYMENT_METHOD) as [string, ...string[]];
const paymentStatusValues = Object.values(PAYMENT_STATUS) as [string, ...string[]];
const orderStatusValues = Object.values(ORDER_STATUS) as [string, ...string[]];

export const recordPaymentSchema = z.object({
  inquiryId: z.string().uuid(),
  amount: z.coerce.number().min(0).max(100_000_000),
  method: z.enum(methodValues).optional(),
  status: z.enum(paymentStatusValues),
  transactionRef: z.string().trim().max(120).optional().or(z.literal("")),
  paymentDate: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const updateOrderStatusSchema = z.object({
  inquiryId: z.string().uuid(),
  toStatus: z.enum(orderStatusValues),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
