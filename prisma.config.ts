// Load environment variables from .env files
// Required for Prisma CLI to access DATABASE_URL in prisma.config.ts
import "dotenv/config"

import path from "node:path"
import { defineConfig, env } from "prisma/config"

/**
 * Prisma Configuration (v7.2)
 *
 * Modern TypeScript-based configuration for Prisma CLI.
 * This file centralizes CLI configuration previously in package.json.
 *
 * Multi-File Schema Setup:
 * - Points to the `prisma` directory (not a single file) to enable multi-schema support
 * - All *.prisma files in prisma/models/ are automatically included
 * - Main schema.prisma defines datasource and generator blocks
 *
 * Configuration Structure:
 * - schema.prisma: Datasource and generator configuration
 * - prisma.config.ts: Schema path, migrations path, and seed command
 * - prisma/models/*.prisma: Model files with business logic
 *
 * Model Files:
 * - auth.prisma: User, Account, Session, authentication tokens
 * - project.prisma: Project (clearance jobs)
 * - task.prisma: Task management with categories
 * - shipment.prisma: Shipment, tracking stages
 * - invoice.prisma: Invoice, invoice items, stage invoices
 * - client.prisma: Client/importer management
 * - customs.prisma: Customs declarations, documents
 * - notification.prisma: Notifications, WhatsApp messages
 * - assignment.prisma: Task assignment rules
 * - company.prisma: Company settings
 *
 * Learn more:
 * - https://www.prisma.io/docs/orm/reference/prisma-config-reference
 */
export default defineConfig({
  // Schema engine configuration (required for v7)
  engine: "classic",

  // Database connection configuration
  // Required when using engine: "classic"
  // The URL here can override the one in schema.prisma if needed
  datasource: {
    url: env("DATABASE_URL"),
  },

  // Multi-file schema support
  // Points to the prisma directory which contains:
  // - schema.prisma (datasource + generator config)
  // - models/*.prisma (model files)
  schema: path.join("prisma"),

  // Migrations configuration
  migrations: {
    // Directory for storing migration files
    path: path.join("prisma", "migrations"),

    // Seed command (replaces package.json prisma.seed config)
    // Uses tsx to execute TypeScript seed files
    // Modular seed structure in prisma/seeds/ (follows prisma/models pattern)
    seed: "tsx prisma/seeds/index.ts",
  },
})
