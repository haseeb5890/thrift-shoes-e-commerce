import { createHash } from "crypto"

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const ACCESS_TOKEN = process.env.META_CONVERSIONS_API_ACCESS_TOKEN
// Set only while verifying in Events Manager's Test Events tool — unlike browser Pixel events,
// server-side Conversions API calls need this to show up there. Remove the env var once
// confirmed so production traffic isn't tagged as test data.
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE
const API_VERSION = "v21.0"

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

// Meta's matching spec: email lowercased/trimmed; phone digits-only with country code, no
// leading 0/+. Checkout only accepts Pakistani numbers as 03XXXXXXXXX (see checkoutSchema in
// app/actions/orders.ts), so the leading 0 is swapped for the 92 country code.
function hashEmail(email: string) {
  return sha256(email.trim().toLowerCase())
}

function hashPakistaniPhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return sha256(`92${digits.replace(/^0/, "")}`)
}

type ConversionEvent = {
  eventName: "Purchase" | "InitiateCheckout"
  eventId: string
  eventSourceUrl: string
  userAgent: string | null
  email: string
  phone: string
  value: number
  currency: string
}

// Fire-and-forget from the caller's perspective: swallows its own errors so a Meta API hiccup
// never breaks order placement, which is the thing that actually matters to the customer.
export async function sendConversionEvent(event: ConversionEvent) {
  if (!PIXEL_ID || !ACCESS_TOKEN) return

  try {
    const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            event_name: event.eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: event.eventId,
            action_source: "website",
            event_source_url: event.eventSourceUrl,
            user_data: {
              em: [hashEmail(event.email)],
              ph: [hashPakistaniPhone(event.phone)],
              ...(event.userAgent ? { client_user_agent: event.userAgent } : {}),
            },
            custom_data: {
              value: event.value,
              currency: event.currency,
            },
          },
        ],
        ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
      }),
    })
    if (!response.ok) {
      console.error("Meta Conversions API error", response.status, await response.text())
    }
  } catch (err) {
    console.error("Meta Conversions API request failed", err)
  }
}
