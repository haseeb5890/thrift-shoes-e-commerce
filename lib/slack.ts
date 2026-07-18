import { formatPKR } from "@/lib/store-data"

const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

function absoluteImageUrl(url: string) {
  return url.startsWith("http") ? url : `${SITE_URL}${url}`
}

type SlackOrderItem = { slug: string | null; name: string; size: string; imageUrl: string }

function itemBlocks(items: SlackOrderItem[]) {
  return items.map((item) => ({
    type: "section",
    text: { type: "mrkdwn", text: `${item.slug ? `<${SITE_URL}/shop/${item.slug}|${item.name}>` : item.name} · Size ${item.size}` },
    accessory: { type: "image", image_url: absoluteImageUrl(item.imageUrl), alt_text: item.name },
  }))
}

async function postToSlack(payload: { text: string; blocks?: unknown[] }) {
  if (!WEBHOOK_URL) return
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error("Failed to send Slack alert", err)
  }
}

export function notifyNewOrder(params: {
  orderNumber: string
  customerName: string
  city: string
  total: number
  paymentMethod: string
  items: SlackOrderItem[]
}) {
  const summary = `:package: *New order ${params.orderNumber}* — ${params.customerName} (${params.city})\n${formatPKR(params.total)} · ${params.paymentMethod === "cod" ? "Cash on delivery" : "Bank transfer"}`

  const blocks = [{ type: "section", text: { type: "mrkdwn", text: summary } }, ...itemBlocks(params.items)]

  return postToSlack({ text: `New order ${params.orderNumber} — ${params.customerName}`, blocks })
}

export function notifyOrderConfirmed(params: {
  orderNumber: string
  customerName: string
  via: "customer" | "admin"
  items: SlackOrderItem[]
}) {
  const summary = `:white_check_mark: *Order confirmed ${params.orderNumber}* — ${params.customerName} (confirmed by ${params.via === "customer" ? "customer via email link" : "admin"})`

  const blocks = [{ type: "section", text: { type: "mrkdwn", text: summary } }, ...itemBlocks(params.items)]

  return postToSlack({ text: `Order confirmed ${params.orderNumber} — ${params.customerName}`, blocks })
}
