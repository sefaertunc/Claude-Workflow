import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';

// Mock ora
vi.mock('ora', () => ({
  default: () => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    text: '',
  }),
}));

// Suppress console output
vi.spyOn(console, 'log').mockImplementation(() => {});

import { backupCommand } from '../../src/commands/backup.js';

describe('backup command', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cw-backup-cmd-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tmpDir);
    vi.clearAllMocks();
  });

  it('creates a backup and displays summary', async () => {
    // Set up a project with workflow files
    await fs.ensureDir(path.join(tmpDir, '.claude', 'agents'));
    await fs.ensureDir(path.join(tmpDir, '.claude', 'commands'));
    await fs.ensureDir(path.join(tmpDir, '.claude', 'skills'));
    await fs.writeFile(path.join(tmpDir, 'CLAUDE.md'), '# Project');
    await fs.writeFile(path.join(tmpDir, '.claude', 'settings.json'), '{}');
    await fs.writeFile(path.join(tmpDir, '.claude', 'agents', 'test.md'), '# Agent');
    await fs.writeFile(path.join(tmpDir, '.claude', 'commands', 'start.md'), '# Cmd');
    await fs.writeFile(path.join(tmpDir, '.claude', 'skills', 'test.md'), '# Skill');

    await backupCommand();

    // Verify backup was created
    const entries = await fs.readdir(tmpDir);
    const backupDirs = entries.filter((e) => e.startsWith('.claude-backup-'));
    expect(backupDirs).toHaveLength(1);
  });

  it('handles empty project gracefully', async () => {
    // No files at all
    await backupCommand();

    const entries = await fs.readdir(tmpDir);
    const backupDirs = entries.filter((e) => e.startsWith('.claude-backup-'));
    expect(backupDirs).toHaveLength(1);
  });
});
