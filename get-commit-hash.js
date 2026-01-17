#!/usr/bin/env node

import { execSync } from "child_process";

try {
  // Try to get the short commit hash
  const commitHash = execSync("git rev-parse --short HEAD", {
    encoding: "utf8",
    stdio: "pipe",
  }).trim();

  // Output just the hash (no newline)
  process.stdout.write(commitHash);
} catch (error) {
  // Git not available or not a git repository, output 'unknown'
  process.stdout.write("unknown");
}
