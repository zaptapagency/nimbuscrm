// Test database setup for integration tests.
// Currently integration tests are skipped due to schema provider mismatch
// (schema.prisma is hardcoded to PostgreSQL for production, but tests need SQLite).
// This is a known limitation that will be addressed in a future iteration
// when we implement a provider-agnostic test infrastructure.

export const TEST_DATABASE_URL = "file:./prisma/test.db";

export default function setup() {
  // No-op setup to allow tests to load
  // Integration tests will fail to connect, but that's expected in the current state
  return () => {
    // No-op teardown
  };
}
