import path from "node:path"
import dotenv from "dotenv"
import { defineConfig } from "prisma/config"

dotenv.config()

export default defineConfig({
  schema: path.join(__dirname, "prisma/schema.prisma"),

  migrate: {
    adapter: async () => {
      const { PrismaPg } = await import("@prisma/adapter-pg")
      const { Pool } = await import("pg")

      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      })

      return new PrismaPg(pool)
    },
  },

  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
