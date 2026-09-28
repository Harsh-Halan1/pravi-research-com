import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  praviAdminPrisma?: PrismaClient;
};

/** Privileged access for local administrative scripts only; never import in app routes. */
export function getAdminPrisma() {
  if (!process.env.DIRECT_URL) {
    throw new Error(
      "DIRECT_URL is required for administrative database tasks.",
    );
  }
  if (!globalForPrisma.praviAdminPrisma) {
    globalForPrisma.praviAdminPrisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
    });
  }
  return globalForPrisma.praviAdminPrisma;
}
