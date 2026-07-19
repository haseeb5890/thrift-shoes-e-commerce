import { Resend } from "resend"
import { formatPKR } from "@/lib/store-data"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_builds");
const FROM = process.env.EMAIL_FROM ?? "orders@resend.dev"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

const COLORS = {
  background: "#f4f1e8",
  card: "#fbfaf5",
  foreground: "#182019",
  muted: "#687069",
  primary: "#2C5A4D",
  primaryForeground: "#fffaf1",
  border: "#cfc9bc",
}

const HEADING_FONT = "'Playfair Display', Georgia, 'Times New Roman', serif"
const BODY_FONT = "'DM Sans', Arial, Helvetica, sans-serif"

function absoluteImageUrl(url: string) {
  return url.startsWith("http") ? url : `${SITE_URL}${url}`
}

type OrderEmailItem = { name: string; size: string; price: number; imageUrl: string }

function itemRowsHtml(items: OrderEmailItem[]) {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.border};" width="64">
            <img src="${absoluteImageUrl(item.imageUrl)}" width="56" height="56" alt="${item.name}" style="display: block; width: 56px; height: 56px; object-fit: cover; border: 1px solid ${COLORS.border};" />
          </td>
          <td style="padding: 12px 0 12px 14px; border-bottom: 1px solid ${COLORS.border}; font-family: ${BODY_FONT}; color: ${COLORS.foreground};">
            <div style="font-size: 14px; font-weight: 700;">${item.name}</div>
            <div style="font-size: 12px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 2px;">Size ${item.size}</div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.border}; font-family: ${BODY_FONT}; color: ${COLORS.foreground}; font-size: 14px; font-weight: 700; text-align: right; white-space: nowrap;" width="90">
            ${formatPKR(item.price)}
          </td>
        </tr>`
    )
    .join("")
}

function totalsHtml(params: { subtotal: number; shippingFee: number; total: number }) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family: ${BODY_FONT}; font-size: 13px; color: ${COLORS.foreground};">
      <tr>
        <td style="padding: 4px 0; color: ${COLORS.muted};">Subtotal</td>
        <td style="padding: 4px 0; text-align: right;">${formatPKR(params.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: ${COLORS.muted};">Shipping</td>
        <td style="padding: 4px 0; text-align: right;">${formatPKR(params.shippingFee)}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0 0; font-weight: 700; font-size: 16px; border-top: 1px solid ${COLORS.border};">Total</td>
        <td style="padding: 10px 0 0; font-weight: 700; font-size: 16px; text-align: right; border-top: 1px solid ${COLORS.border};">${formatPKR(params.total)}</td>
      </tr>
    </table>`
}

// Shared chrome (logo/ribbon header + dark footer) around a per-email body block, so each
// transactional email (confirm-request, confirmed, cancelled) stays visually consistent with
// the site's actual branding instead of drifting into generic-receipt styling over time.
function wrapEmail(title: string, bodyHtml: string) {
  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
    <title>${title}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${COLORS.background};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; background-color: ${COLORS.card}; border: 1px solid ${COLORS.border};">
            <tr>
              <td align="center" style="padding: 32px 32px 20px;">
                <img src="${SITE_URL}/logocheck.png" width="160" alt="Prime Soles" style="display: block; width: 160px; height: auto;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="background-color: ${COLORS.primary}; padding: 10px 16px;">
                <span style="font-family: ${BODY_FONT}; color: ${COLORS.primaryForeground}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">
                  Professionally cleaned &middot; Nationwide delivery &middot; One pair only
                </span>
              </td>
            </tr>
            ${bodyHtml}
            <tr>
              <td style="background-color: ${COLORS.foreground}; padding: 24px 32px;">
                <p style="margin: 0; font-family: ${BODY_FONT}; color: ${COLORS.background}; font-size: 12px; line-height: 18px;">
                  Curated second-life sneakers, cleaned and condition-checked in Pakistan. Better pairs, lighter footprint.
                </p>
                <p style="margin: 10px 0 0; font-family: ${BODY_FONT}; color: ${COLORS.background}; opacity: 0.7; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;">
                  COD nationwide &middot; WhatsApp support &middot; hello@primesoles.pk
                </p>
                <p style="margin: 14px 0 0; font-family: ${BODY_FONT}; color: ${COLORS.background}; opacity: 0.5; font-size: 11px;">
                  &copy; 2026 Prime Soles. Built for better rotation.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`
}

function ctaButtonHtml(href: string, label: string) {
  return `
    <tr>
      <td align="center" style="padding: 28px 32px 8px;">
        <a href="${href}" style="display: inline-block; background-color: ${COLORS.primary}; color: ${COLORS.primaryForeground}; font-family: ${BODY_FONT}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; text-decoration: none; padding: 14px 28px;">
          ${label}
        </a>
      </td>
    </tr>`
}

async function dispatch(to: string, subject: string, html: string, failureMessage: string) {
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error(failureMessage, err)
  }
}

export async function sendOrderConfirmationEmail(params: {
  to: string
  customerName: string
  orderNumber: string
  items: OrderEmailItem[]
  subtotal: number
  shippingFee: number
  total: number
  confirmationToken: string
}) {
  const confirmUrl = `${SITE_URL}/order-confirm?token=${params.confirmationToken}`

  const body = `
    <tr>
      <td style="padding: 32px 32px 8px;">
        <p style="margin: 0; font-family: ${BODY_FONT}; color: ${COLORS.muted}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">Order ${params.orderNumber}</p>
        <h1 style="margin: 6px 0 0; font-family: ${HEADING_FONT}; color: ${COLORS.foreground}; font-size: 28px; font-weight: 700;">Hi ${params.customerName}, confirm your order.</h1>
        <p style="margin: 12px 0 0; font-family: ${BODY_FONT}; color: ${COLORS.muted}; font-size: 14px; line-height: 20px;">
          Thanks for shopping with us. Click below to confirm this order so we can get your pair ready.
        </p>
      </td>
    </tr>
    <tr><td style="padding: 16px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRowsHtml(params.items)}</table></td></tr>
    <tr><td style="padding: 16px 32px 0;">${totalsHtml(params)}</td></tr>
    ${ctaButtonHtml(confirmUrl, "Confirm my order")}
    <tr>
      <td style="padding: 8px 32px 32px;">
        <p style="margin: 0; font-family: ${BODY_FONT}; color: ${COLORS.muted}; font-size: 11px; line-height: 16px; text-align: center;">
          If the button doesn't work, paste this link into your browser:<br />
          <a href="${confirmUrl}" style="color: ${COLORS.primary};">${confirmUrl}</a><br />
          This link expires in 7 days. Didn't place this order? You can ignore this email.
        </p>
      </td>
    </tr>`

  await dispatch(params.to, `Confirm your order ${params.orderNumber}`, wrapEmail("Confirm your order", body), "Failed to send order confirmation email")
}

export async function sendOrderConfirmedEmail(params: {
  to: string
  customerName: string
  orderNumber: string
  items: OrderEmailItem[]
  subtotal: number
  shippingFee: number
  total: number
}) {
  const trackUrl = `${SITE_URL}/track`

  const body = `
    <tr>
      <td style="padding: 32px 32px 8px;">
        <p style="margin: 0; font-family: ${BODY_FONT}; color: ${COLORS.muted}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">Order ${params.orderNumber}</p>
        <h1 style="margin: 6px 0 0; font-family: ${HEADING_FONT}; color: ${COLORS.foreground}; font-size: 28px; font-weight: 700;">Hi ${params.customerName}, your order is confirmed.</h1>
        <p style="margin: 12px 0 0; font-family: ${BODY_FONT}; color: ${COLORS.muted}; font-size: 14px; line-height: 20px;">
          We're getting your pair ready. You can follow its progress any time.
        </p>
      </td>
    </tr>
    <tr><td style="padding: 16px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRowsHtml(params.items)}</table></td></tr>
    <tr><td style="padding: 16px 32px 0;">${totalsHtml(params)}</td></tr>
    ${ctaButtonHtml(trackUrl, "Track my order")}
    <tr><td style="padding: 8px 32px 32px;"></td></tr>`

  await dispatch(params.to, `Order confirmed — ${params.orderNumber}`, wrapEmail("Order confirmed", body), "Failed to send order confirmed email")
}

export async function sendOrderCancelledEmail(params: { to: string; customerName: string; orderNumber: string }) {
  const shopUrl = `${SITE_URL}/shop`

  const body = `
    <tr>
      <td style="padding: 32px 32px 8px;">
        <p style="margin: 0; font-family: ${BODY_FONT}; color: ${COLORS.muted}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">Order ${params.orderNumber}</p>
        <h1 style="margin: 6px 0 0; font-family: ${HEADING_FONT}; color: ${COLORS.foreground}; font-size: 28px; font-weight: 700;">Hi ${params.customerName}, your order has been cancelled.</h1>
        <p style="margin: 12px 0 0; font-family: ${BODY_FONT}; color: ${COLORS.muted}; font-size: 14px; line-height: 20px;">
          Order ${params.orderNumber} has been cancelled and won't be shipped. If this wasn't you or you have questions, just reply to this email or reach us on WhatsApp.
        </p>
      </td>
    </tr>
    ${ctaButtonHtml(shopUrl, "Shop other pairs")}
    <tr><td style="padding: 8px 32px 32px;"></td></tr>`

  await dispatch(params.to, `Order cancelled — ${params.orderNumber}`, wrapEmail("Order cancelled", body), "Failed to send order cancelled email")
}
