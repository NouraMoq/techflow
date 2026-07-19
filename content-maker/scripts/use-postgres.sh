#!/usr/bin/env sh
# Switch the Prisma datasource provider to PostgreSQL for production builds.
# Local dev stays on SQLite (schema.prisma default); this runs only inside the
# Docker build / CI ephemeral checkout, so it never mutates your working tree.
# Portable across GNU/BSD/busybox sed (no in-place flag).
set -e
sed 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma > prisma/schema.prisma.tmp
mv prisma/schema.prisma.tmp prisma/schema.prisma
echo "Prisma datasource provider set to: postgresql"
