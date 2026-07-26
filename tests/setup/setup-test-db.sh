#!/bin/bash
# Setup script for tests: temporarily switch Prisma schema to SQLite, create test DB, then restore.

set -e

SCHEMA_FILE="prisma/schema.prisma"
BACKUP_FILE="prisma/schema.prisma.backup"

# Backup the original schema
cp "$SCHEMA_FILE" "$BACKUP_FILE"

# Replace 'provider = "postgresql"' with 'provider = "sqlite"' in the datasource block
sed -i 's/provider = "postgresql"/provider = "sqlite"/g' "$SCHEMA_FILE"

# Run the test DB setup with DATABASE_PROVIDER=sqlite env var
DATABASE_URL="file:./prisma/test.db" DATABASE_PROVIDER="sqlite" npx prisma db push --skip-generate --accept-data-loss

# Restore the original schema
mv "$BACKUP_FILE" "$SCHEMA_FILE"
