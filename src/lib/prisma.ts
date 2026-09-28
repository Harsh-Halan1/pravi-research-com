import { PrismaPg } from "@prisma/adapter-pg";
import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { runWithDatabaseIdentity } from "@/lib/database-context";

const globalForPrisma = globalThis as typeof globalThis & {
  praviPrisma?: PrismaClient;
};

export function getPrisma() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required before accessing the database.");
  }

  if (!globalForPrisma.praviPrisma) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    globalForPrisma.praviPrisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.praviPrisma;
}

export async function withUserDbContext<T>(
  clerkUserId: string,
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
) {
  if (!clerkUserId.trim()) {
    throw new Error(
      "A verified Clerk user ID is required for database access.",
    );
  }

  return getPrisma().$transaction(
    (transaction) =>
      runWithDatabaseIdentity(
        clerkUserId,
        async (verifiedClerkUserId) => {
          await transaction.$queryRaw`
            SELECT set_config('app.clerk_user_id', ${verifiedClerkUserId}, true)
          `;
        },
        () => operation(transaction),
      ),
    { maxWait: 10_000, timeout: 10_000 },
  );
}
