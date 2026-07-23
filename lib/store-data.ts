export type Product = {
  id: string
  slug: string
  name: string
  brand: string
  category: string[]
  gender: string
  size: string
  condition: string
  description: string | null
  price: number
  compareAtPrice: number | null
  imageUrl: string
  imageAlt: string
  color: string
  isFeatured: boolean
  stock: number
}

export const fallbackProducts: Product[] = [
  { id: "p1", slug: "verdant-runner", name: "Verdant Runner", brand: "Reebok", category: ["Running", "Trail"], gender: "Unisex", size: "EU 42", condition: "Excellent", description: null, price: 12400, compareAtPrice: 15900, imageUrl: "/images/runner-green.png", imageAlt: "Green and cream retro running shoes", color: "Green", isFeatured: true, stock: 1 },
  { id: "p2", slug: "navy-court-85", name: "Navy Court 85", brand: "Adidas", category: ["Court"], gender: "Men", size: "EU 43", condition: "Very Good", description: null, price: 10800, compareAtPrice: 13500, imageUrl: "/images/court-white.png", imageAlt: "White court shoes with navy details", color: "White", isFeatured: true, stock: 1 },
  { id: "p3", slug: "karakoram-trail", name: "Karakoram Trail", brand: "Merrell", category: ["Trail"], gender: "Unisex", size: "EU 41", condition: "Excellent", description: null, price: 13900, compareAtPrice: 17200, imageUrl: "/images/trail-brown.png", imageAlt: "Brown trail shoes on neutral backdrop", color: "Brown", isFeatured: true, stock: 1 },
  { id: "p4", slug: "crimson-mile", name: "Crimson Mile", brand: "New Balance", category: ["Running"], gender: "Women", size: "EU 39", condition: "Very Good", description: null, price: 11600, compareAtPrice: 14800, imageUrl: "/images/runner-red.png", imageAlt: "Red and cream vintage running shoes", color: "Red", isFeatured: true, stock: 1 },
]

export const shippingRates: Record<string, number> = { Karachi: 250, Lahore: 250, Islamabad: 250, Rawalpindi: 250, Faisalabad: 350, Multan: 350, Peshawar: 350, Quetta: 350, Sialkot: 350, Gujranwala: 350, Hyderabad: 350, Other: 450 }
export const cities = Object.keys(shippingRates)
export const formatPKR = (amount: number) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(amount)

// All shipments go out via Leopards Courier — this is their public tracking page's URL shape.
export const getCourierTrackingUrl = (trackingNumber: string) => `https://pk.leopardscourier.com/shipment_tracking_view?cn_number=${encodeURIComponent(trackingNumber)}`

// Estimated delivery window: order date + 4 days to order date + 6 days, expressed in
// Pakistan calendar days (not UTC) so an order placed late at night doesn't drift a day off.
export function getDeliveryWindow(orderDate: Date, minDays = 4, maxDays = 6): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(orderDate)
  const y = Number(parts.find((p) => p.type === "year")!.value)
  const m = Number(parts.find((p) => p.type === "month")!.value)
  const d = Number(parts.find((p) => p.type === "day")!.value)
  const civil = new Date(Date.UTC(y, m - 1, d))

  const start = new Date(civil)
  start.setUTCDate(start.getUTCDate() + minDays)
  const end = new Date(civil)
  end.setUTCDate(end.getUTCDate() + maxDays)

  const monthOf = (date: Date) => date.toLocaleString("en-PK", { month: "long", timeZone: "UTC" })
  const startMonth = monthOf(start)
  const endMonth = monthOf(end)

  return startMonth === endMonth
    ? `${start.getUTCDate()}–${end.getUTCDate()} ${startMonth}`
    : `${start.getUTCDate()} ${startMonth} – ${end.getUTCDate()} ${endMonth}`
}