/**
 * Environment variable validation.
 * Runs at boot time to catch configuration errors early.
 */

const isProduction = process.env.NODE_ENV === "production";

export function validateEnv() {
  const errors: string[] = [];
  const warnings: string[] = [];

  // DATABASE_URL must be present
  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL environment variable is required");
  }

  // NEXTAUTH_SECRET must be present and not too short
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    errors.push("NEXTAUTH_SECRET environment variable is required");
  } else if (secret.length < 32) {
    errors.push("NEXTAUTH_SECRET must be at least 32 characters long");
  }

  // In production, warn (don't error) about dev default secret to allow builds to proceed
  const devDefaultSecret = "dev-secret-change-me-in-production-please-9f8a7b6c5d4e3f2a";
  const isRailwayProduction = isProduction && process.env.DATABASE_URL?.includes("railway");
  if (isRailwayProduction && secret === devDefaultSecret) {
    warnings.push(
      "⚠️  NEXTAUTH_SECRET is using the development default. Generate a new secret with: openssl rand -base64 32"
    );
  }

  if (errors.length > 0) {
    console.error("❌ Environment validation failed:");
    errors.forEach((err) => console.error(`   - ${err}`));
    throw new Error(`Invalid environment configuration. See errors above.`);
  }

  if (warnings.length > 0) {
    warnings.forEach((msg) => console.warn(msg));
  }

  if (errors.length === 0) {
    console.log("✓ Environment validation passed");
  }
}
