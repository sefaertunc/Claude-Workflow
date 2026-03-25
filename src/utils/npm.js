import { execSync } from 'node:child_process';

/**
 * Fetch the latest published version of worclaude from the npm registry.
 * Returns null if offline or if the command fails.
 */
export function getLatestNpmVersion() {
  try {
    return execSync('npm view worclaude version', {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();
  } catch {
    return null;
  }
}
