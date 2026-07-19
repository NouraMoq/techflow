import { execSync } from "node:child_process";

// Re-seed the DB before the E2E run so tests start from a known state.
export default async function globalSetup() {
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
}
