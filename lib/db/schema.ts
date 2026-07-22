import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const products = pgTable(
  "products",
  // category is an array so a pair can be tagged into more than one type (e.g. both Running
  // and Trail) and show up under every matching filter, instead of picking a single bucket.
  { id: text("id").primaryKey(), slug: text("slug").notNull().unique(), name: text("name").notNull(), brand: text("brand").notNull(), category: text("category").array().notNull().default(sql`'{}'::text[]`), gender: text("gender").notNull(), size: text("size").notNull(), condition: text("condition").notNull(), description: text("description"), price: integer("price").notNull(), compareAtPrice: integer("compare_at_price"), imageUrl: text("image_url").notNull(), imageAlt: text("image_alt").notNull(), color: text("color").notNull(), isFeatured: boolean("is_featured").notNull().default(false), isActive: boolean("is_active").notNull().default(true), stock: integer("stock").notNull().default(1), soldAt: timestamp("sold_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow() },
  (table) => ({
    activeStockIdx: index("products_active_stock_idx").on(table.isActive, table.stock),
    categoryIdx: index("products_category_idx").using("gin", table.category),
    genderIdx: index("products_gender_idx").on(table.gender),
    brandIdx: index("products_brand_idx").on(table.brand),
    sizeIdx: index("products_size_idx").on(table.size),
    conditionIdx: index("products_condition_idx").on(table.condition),
    priceIdx: index("products_price_idx").on(table.price),
    isFeaturedIdx: index("products_is_featured_idx").on(table.isFeatured),
  }),
)
export const productMedia = pgTable("product_media", { id: text("id").primaryKey(), productId: text("product_id").notNull(), url: text("url").notNull(), kind: text("kind").notNull(), sortOrder: integer("sort_order").notNull().default(0), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() })
export const addresses = pgTable("addresses", { id: text("id").primaryKey(), userId: text("user_id").notNull(), label: text("label").notNull(), fullName: text("full_name").notNull(), phone: text("phone").notNull(), city: text("city").notNull(), addressLine: text("address_line").notNull(), postalCode: text("postal_code"), isDefault: boolean("is_default").notNull().default(false), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() })

// A profile is created for every checkout (guest or logged-in), keyed by email.
// authUserId stays null until the person actually authenticates (magic link/OTP) with
// that same email — at which point app/auth/callback/route.ts links it, and every past
// guest order under this profile's id becomes theirs automatically.
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  phone: text("phone"),
  authUserId: text("auth_user_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const orders = pgTable("orders", { id: text("id").primaryKey(), orderNumber: text("order_number").notNull().unique(), userId: text("user_id"), customerName: text("customer_name").notNull(), email: text("email").notNull(), phone: text("phone").notNull(), city: text("city").notNull(), addressLine: text("address_line").notNull(), postalCode: text("postal_code"), paymentMethod: text("payment_method").notNull(), paymentStatus: text("payment_status").notNull().default("pending"), status: text("status").notNull().default("placed"), isNew: boolean("is_new").notNull().default(true), subtotal: integer("subtotal").notNull(), shippingFee: integer("shipping_fee").notNull(), promoCode: text("promo_code"), discountAmount: integer("discount_amount").notNull().default(0), total: integer("total").notNull(), notes: text("notes"), trackingNumber: text("tracking_number"), confirmationToken: text("confirmation_token"), confirmationExpiresAt: timestamp("confirmation_expires_at", { withTimezone: true }), confirmedAt: timestamp("confirmed_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow() })

// maxUses is the total number of redemptions allowed ("promo tickets"); usedCount is claimed
// atomically inside the checkout transaction (same pattern as product stock) to prevent two
// concurrent checkouts from both redeeming the last ticket.
export const promoCodes = pgTable("promo_codes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").notNull(),
  maxUses: integer("max_uses").notNull(),
  usedCount: integer("used_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export const orderItems = pgTable("order_items", { id: text("id").primaryKey(), orderId: text("order_id").notNull(), productId: text("product_id").notNull(), productSlug: text("product_slug"), productName: text("product_name").notNull(), size: text("size").notNull(), quantity: integer("quantity").notNull(), unitPrice: integer("unit_price").notNull(), imageUrl: text("image_url").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() })

// One row per (profile, product). priceAtAdd enables price-drop detection: compare against
// the live products.price at read time.
export const wishlists = pgTable(
  "wishlists",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id").notNull(),
    productId: text("product_id").notNull(),
    priceAtAdd: integer("price_at_add").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueProfileProduct: uniqueIndex("wishlists_profile_product_unique").on(table.profileId, table.productId),
  }),
)

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(), // 1-5
  body: text("body").notNull(),
  photoUrl: text("photo_url"),
  productId: text("product_id"), // optional link to the specific pair reviewed
  source: text("source").notNull().default("customer"), // "customer" | "admin"
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected"
  submittedEmail: text("submitted_email"), // only set for customer submissions, for moderation contact
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})