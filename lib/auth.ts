import { betterAuth } from "better-auth"
import { pool } from "@/lib/db"

const runtimeURL = process.env.V0_RUNTIME_URL
const deploymentURL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined
const productionURL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL:
    process.env.BETTER_AUTH_URL ?? productionURL ?? deploymentURL ?? runtimeURL,
  emailAndPassword: { enabled: true, autoSignIn: true },
  trustedOrigins: [
    ...(runtimeURL ? [runtimeURL] : []),
    ...(deploymentURL ? [deploymentURL] : []),
    ...(productionURL ? [productionURL] : []),
    "https://*.vusercontent.net",
    ...(process.env.NODE_ENV === "development" ? ["http://localhost:*", "https://localhost:*"] : []),
  ],
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  ...(process.env.NODE_ENV === "development" ? { advanced: { defaultCookieAttributes: { sameSite: "none" as const, secure: true } } } : {}),
})
