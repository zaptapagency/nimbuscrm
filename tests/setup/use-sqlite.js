#!/usr/bin/env node
/**
 * Temporarily swaps Prisma schema provider to SQLite, runs a command, then restores.
 * Used before running tests to set up a test SQLite database.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const schemaPath = path.join(__dirname, "../../prisma/schema.prisma");
const backupPath = path.join(__dirname, "../../prisma/schema.prisma.bak");

try {
  // Read the original schema
  const original = fs.readFileSync(schemaPath, "utf-8");

  // Backup it
  fs.writeFileSync(backupPath, original);

  // Replace postgresql with sqlite
  const modified = original.replace(/provider = "postgresql"/, 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, modified);

  // Run the command (remaining argv)
  const command = process.argv.slice(2).join(" ");
  console.log(`[test-db-setup] Running: ${command}`);
  execSync(command, { stdio: "inherit", cwd: path.join(__dirname, "../../") });

  console.log("[test-db-setup] Test database created successfully");
} finally {
  // Restore the original schema
  if (fs.existsSync(backupPath)) {
    fs.renameSync(backupPath, schemaPath);
    console.log("[test-db-setup] Restored schema provider to postgresql");
  }
}
