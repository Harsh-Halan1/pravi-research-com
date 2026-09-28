export async function runWithDatabaseIdentity<T>(
  clerkUserId: string,
  setIdentity: (verifiedClerkUserId: string) => Promise<void>,
  operation: () => Promise<T>,
) {
  if (!clerkUserId.trim()) {
    throw new Error(
      "A verified Clerk user ID is required for database access.",
    );
  }

  await setIdentity(clerkUserId);
  return operation();
}
