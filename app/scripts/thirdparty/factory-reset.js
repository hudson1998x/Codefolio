#!/usr/bin/env node

/**
 * Codefolio Reset Script
 * Wipes the repo to a clean slate — fresh deps, empty build/content/media, new git history.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ─── Config ──────────────────────────────────────────────────────────────────

const ROOT = process.cwd();

const DIRS_TO_DELETE = [
  "build",
  "content",
  "media",
  ".git",
];

const INITIAL_COMMIT_MESSAGE = "Codefolio: clean install performed, ready for use";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[reset] ${msg}`);
}

function err(msg) {
  console.error(`[reset] ERROR: ${msg}`);
}

function abort(message, error) {
  err(message);
  if (error) err(error.message ?? String(error));
  process.exit(1);
}

function run(cmd, label) {
  log(`${label}…`);
  try {
    execSync(cmd, { cwd: ROOT, stdio: "inherit" });
  } catch (e) {
    abort(`Failed: ${label}`, e);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(function main() {
  log("Starting Codefolio reset…");
  console.log("");

  // 1. Install dependencies
  run("npm install", "Installing dependencies");
  console.log("");

  // 2. Delete directories
  for (const dir of DIRS_TO_DELETE) {
    const target = path.join(ROOT, dir);

    if (!fs.existsSync(target)) {
      log(`Skipping ${dir}/ (not found)`);
      continue;
    }

    log(`Deleting ${dir}/…`);
    try {
      fs.rmSync(target, { recursive: true, force: true });
      log(`Deleted ${dir}/`);
    } catch (e) {
      abort(`Failed to delete ${dir}/`, e);
    }
  }

  console.log("");

  // 3. Reinitialise git and make the initial commit
  run("git init", "Reinitialising git repository");
  run("git add -A", "Staging all files");
  run(`git commit -m "${INITIAL_COMMIT_MESSAGE}"`, "Creating initial commit");
  console.log("");

  // 4. Summary
  console.log("─────────────────────────────────────────");
  console.log("  Codefolio Reset — Done");
  console.log("─────────────────────────────────────────");
  console.log("  ✔  Dependencies installed");
  for (const dir of DIRS_TO_DELETE) {
    console.log(`  ✔  ${dir}/ removed`);
  }
  console.log("  ✔  Git reinitialised");
  console.log("  ✔  Initial commit created");
  console.log("─────────────────────────────────────────");
  console.log("");
  console.log("  Your repo is now a clean slate.");
  console.log("  Don't forget to set your remote back up:");
  console.log("  git remote add origin <your-repo-url>");
  console.log("");
})();