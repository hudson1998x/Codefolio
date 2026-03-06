#!/usr/bin/env node

/**
 * Codefolio Update Script
 * Pulls latest framework files from the upstream Codefolio repo
 * into the current project directory.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// ─── Config ──────────────────────────────────────────────────────────────────

const REPO_URL = "https://github.com/hudson1998x/Codefolio.git";

/** Paths (relative to repo root) to sync into the current project. */
const SYNC_PATHS = [
  "app/web/themes/admin",
  "app/web/themes/default",
  "app/web/thirdparty",
  "app/code/thirdparty",
  "app/code/bootstrap.ts",
  "app/scripts/thirdparty"
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROOT = process.cwd();

/** Temporary clone directory — created fresh each run. */
const TMP_DIR = path.join(os.tmpdir(), `codefolio-update-${Date.now()}`);

function log(msg) {
  console.log(`[update] ${msg}`);
}

function err(msg) {
  console.error(`[update] ERROR: ${msg}`);
}

/** Remove the temporary clone directory if it exists. */
function cleanup() {
  if (fs.existsSync(TMP_DIR)) {
    log("Cleaning up temporary clone directory…");
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
    log("Cleanup complete.");
  }
}

/** Abort with an error message, clean up, and exit non-zero. */
function abort(message, error) {
  err(message);
  if (error) err(error.message ?? String(error));
  cleanup();
  process.exit(1);
}

/**
 * Recursively copy src → dest.
 * dest is created if it does not exist.
 */
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    // Ensure parent directory exists (handles single-file entries like bootstrap.ts)
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

/**
 * Reads the version field from a package.json file.
 * Returns null if the file doesn't exist or has no version field.
 */
function readPackageVersion(pkgPath) {
  if (!fs.existsSync(pkgPath)) return null;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    return pkg.version ?? null;
  } catch {
    return null;
  }
}

/**
 * Updates the version field in the local package.json.
 * Preserves all other fields and formatting.
 */
function syncPackageVersion(upstreamVersion) {
  const localPkgPath = path.join(ROOT, "package.json");

  if (!fs.existsSync(localPkgPath)) {
    err("No local package.json found — skipping version sync.");
    return { status: "skipped (no local package.json)" };
  }

  let localPkg;
  try {
    localPkg = JSON.parse(fs.readFileSync(localPkgPath, "utf8"));
  } catch (e) {
    err(`Failed to parse local package.json: ${e.message}`);
    return { status: "skipped (parse error)" };
  }

  const previousVersion = localPkg.version ?? "(none)";

  if (previousVersion === upstreamVersion) {
    log(`package.json version already up to date (${upstreamVersion}).`);
    return { status: `already up to date (${upstreamVersion})` };
  }

  localPkg.version = upstreamVersion;

  try {
    fs.writeFileSync(localPkgPath, JSON.stringify(localPkg, null, 2) + "\n", "utf8");
    log(`package.json version updated: ${previousVersion} → ${upstreamVersion}`);
    return { status: `updated ${previousVersion} → ${upstreamVersion}` };
  } catch (e) {
    abort("Failed to write updated package.json.", e);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(function main() {
  log(`Starting Codefolio update in: ${ROOT}`);
  log(`Temporary clone target: ${TMP_DIR}`);

  // 1. Clone the upstream repo
  log(`Cloning ${REPO_URL}…`);
  try {
    execSync(`git clone --depth 1 "${REPO_URL}" "${TMP_DIR}"`, {
      stdio: "inherit",
    });
  } catch (e) {
    abort("Failed to clone the repository.", e);
  }

  // 2. Sync each specified path
  const results = [];

  for (const relPath of SYNC_PATHS) {
    const srcPath = path.join(TMP_DIR, relPath);
    const destPath = path.join(ROOT, relPath);

    log(`Syncing: ${relPath}`);

    if (!fs.existsSync(srcPath)) {
      // Non-fatal — report and continue so other paths still sync
      err(`Source path not found in repo, skipping: ${relPath}`);
      results.push({ path: relPath, status: "skipped (not found in repo)" });
      continue;
    }

    try {
      copyRecursive(srcPath, destPath);
      results.push({ path: relPath, status: "ok" });
    } catch (e) {
      abort(`Failed to copy "${relPath}" to destination.`, e);
    }
  }

  // 3. Sync package.json version from upstream
  log("Checking upstream package.json version…");
  const upstreamPkgPath = path.join(TMP_DIR, "package.json");
  const upstreamVersion = readPackageVersion(upstreamPkgPath);

  let versionResult;
  if (!upstreamVersion) {
    err("No version found in upstream package.json — skipping version sync.");
    versionResult = { path: "package.json (version)", status: "skipped (no upstream version)" };
  } else {
    log(`Upstream version: ${upstreamVersion}`);
    const syncStatus = syncPackageVersion(upstreamVersion);
    versionResult = { path: "package.json (version)", status: syncStatus.status };
  }

  // 4. Clean up the temporary clone
  cleanup();

  // 5. Report summary
  console.log("\n─────────────────────────────────────────");
  console.log("  Codefolio Update — Done");
  console.log("─────────────────────────────────────────");
  for (const r of results) {
    const icon = r.status === "ok" ? "✔" : "⚠";
    console.log(`  ${icon}  ${r.path}  →  ${r.status}`);
  }
  const vIcon = versionResult.status.startsWith("updated") ? "✔" : "⚠";
  console.log(`  ${vIcon}  ${versionResult.path}  →  ${versionResult.status}`);
  console.log("─────────────────────────────────────────\n");
})();