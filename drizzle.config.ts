import { config } from "dotenv"
config({ path: ".env.local" })
config({ path: ".env.development.local" })

import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
})