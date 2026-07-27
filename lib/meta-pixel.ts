declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

// No-ops if the base snippet hasn't loaded yet (ad blocker, script still fetching, Pixel ID
// unset) — every call site can fire-and-forget without checking readiness itself.
//
// `eventId` is deliberately its own parameter, not part of `params`: fbq only recognizes it for
// browser/server dedup when passed as a separate `{eventID: ...}` options argument — putting it
// inside the event data object (an earlier mistake here) silently gets ignored for matching, so
// the browser and server side of the same Purchase never link up and get double-counted.
export function trackPixelEvent(eventName: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return
  if (eventId) window.fbq("track", eventName, params, { eventID: eventId })
  else window.fbq("track", eventName, params)
}
