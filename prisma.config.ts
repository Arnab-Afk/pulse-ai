// Prisma configuration for Pulse AI
import path from "path";
import { config } from "dotenv";

// Load .env.local for local development
config({ path: path.resolve(process.cwd(), ".env.local") });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
