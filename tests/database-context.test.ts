import assert from "node:assert/strict";
import { test } from "node:test";
import { runWithDatabaseIdentity } from "../src/lib/database-context";

test("database context is established before protected queries run", async () => {
  const events: string[] = [];
  const result = await runWithDatabaseIdentity(
    "user_verified_by_clerk",
    async (clerkUserId) => {
      events.push(`identity:${clerkUserId}`);
    },
    async () => {
      events.push("query");
      return "result";
    },
  );

  assert.deepEqual(events, ["identity:user_verified_by_clerk", "query"]);
  assert.equal(result, "result");
});

test("empty identities fail before any database operation", async () => {
  let didSetIdentity = false;

  await assert.rejects(
    runWithDatabaseIdentity(
      "  ",
      async () => {
        didSetIdentity = true;
      },
      async () => "should not run",
    ),
    /verified Clerk user ID is required/,
  );
  assert.equal(didSetIdentity, false);
});
