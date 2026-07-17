export const ORDER_STATUSES = ["placed", "processing", "shipped", "delivered", "cancelled"] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]