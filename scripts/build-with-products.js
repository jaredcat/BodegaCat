#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appDir = path.join(__dirname, "..", "apps", "template");

console.log("🚀 Building Bodega Cat with product generation...\n");

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const envContent = fs.readFileSync(envPath, "utf8");
  const envLines = envContent.split("\n");

  envLines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      const [key, ...valueParts] = trimmedLine.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").replace(/^["']|["']$/g, "");
        process.env[key] = value;
      }
    }
  });
}

// Repo root .env, then apps/template/.env (later overrides earlier)
loadEnvFile(path.join(__dirname, "..", ".env"));
loadEnvFile(path.join(appDir, ".env"));

// Check if environment variables are set
const requiredEnvVars = ["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingVars.forEach((varName) => console.error(`   - ${varName}`));
  console.error(
    "\nPlease set these variables in your .env file or environment.",
  );
  console.error(
    `Tip: use ${path.join("apps", "template", ".env")} or the repo root .env.`,
  );
  process.exit(1);
}

try {
  // Clean previous build in the template app
  const appDist = path.join(appDir, "dist");
  console.log("🧹 Cleaning previous build...");
  if (fs.existsSync(appDist)) {
    fs.rmSync(appDist, { recursive: true, force: true });
  }

  console.log("🔨 Building site with static product pages...");
  execSync("pnpm run build", { stdio: "inherit", cwd: appDir });

  const shopDir = path.join(appDir, "dist", "shop");
  if (fs.existsSync(shopDir)) {
    const productDirs = fs
      .readdirSync(shopDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    console.log(`\n✅ Build completed successfully!`);
    console.log(`📦 Generated ${productDirs.length} product pages:`);

    if (productDirs.length > 0) {
      productDirs.forEach((dir) => {
        console.log(`   - /shop/${dir}/`);
      });
    } else {
      console.log(
        "   (No products found in Stripe - add some products to see pages generated)",
      );
    }
  } else {
    console.log(
      "\n⚠️  No shop directory found. This might be normal if no products exist.",
    );
  }

  console.log("\n🎉 Build process completed!");
  console.log("💡 To preview the site, run: pnpm preview");
  console.log(
    `🚀 To deploy, run: pnpm deploy (from repo root) or wrangler from ${path.join("apps", "template")}`,
  );
} catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error("\n❌ Build failed:", err.message);
  process.exit(1);
}
