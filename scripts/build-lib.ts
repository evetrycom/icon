import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const PKG_DIR = join(process.cwd(), "packages", "icon-tools");
const DIST_DIR = join(PKG_DIR, "dist");

if (!existsSync(DIST_DIR)) {
  mkdirSync(DIST_DIR, { recursive: true });
}

console.log("📦 Building @evetry/icon-tools...");

// 1. Build ESM bundle
console.log("🔨 Bundling ESM (dist/index.mjs)...");
const esmBuild = spawnSync(
  "bun",
  [
    "build",
    join(PKG_DIR, "src", "index.ts"),
    `--outfile=${join(DIST_DIR, "index.mjs")}`,
    "--target=browser",
    "--format=esm",
    "--minify",
  ],
  { stdio: "inherit" },
);

if (esmBuild.status !== 0) {
  console.error("Failed to build ESM bundle");
  process.exit(1);
}

// 2. Build CJS bundle
console.log("🔨 Bundling CJS (dist/index.cjs)...");
const cjsBuild = spawnSync(
  "bun",
  [
    "build",
    join(PKG_DIR, "src", "index.ts"),
    `--outfile=${join(DIST_DIR, "index.cjs")}`,
    "--target=node",
    "--format=cjs",
    "--minify",
  ],
  { stdio: "inherit" },
);

if (cjsBuild.status !== 0) {
  console.error("Failed to build CJS bundle");
  process.exit(1);
}

// 3. Emit TypeScript Declarations (.d.ts)
console.log("📝 Generating TypeScript declarations (.d.ts)...");
const tsBuild = spawnSync(
  "bun",
  ["x", "tsc", "-p", join(PKG_DIR, "tsconfig.json")],
  { stdio: "inherit" },
);

if (tsBuild.status !== 0) {
  console.warn("⚠️ TypeScript declarations had warnings or errors");
}

console.log(
  "✅ @evetry/icon-tools built successfully into packages/icon-tools/dist/",
);
