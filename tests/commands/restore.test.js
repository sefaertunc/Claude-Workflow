import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';

// Mock inquirer
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

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

import inquirer from 'inquirer';
import { restoreCommand } from '../../src/commands/restore.js';
import { createBackup } from '../../src/core/backup.js';

describe('restore command', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cw-restore-cmd-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tmpDir);
    vi.clearAllMocks();
  });

  it('shows message when no backups exist', async () => {
    await restoreCommand();
    // Should not have called inquirer since there are no backups
    expect(inquirer.prompt).not.toHaveBeenCalled();
  });

  it('restores selected backup after confirmation', async () => {
    // Create original files and backup
    await fs.ensureDir(path.join(tmpDir, '.claude'));
    await fs.writeFile(path.join(tmpDir, 'CLAUDE.md'), '# Original');
    await createBackup(tmpDir);

    // Modify files
    await fs.writeFile(path.join(tmpDir, 'CLAUDE.md'), '# Modified');

    // Mock: select first backup, confirm
    let callCount = 0;
    inquirer.prompt.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ selected: 0 });
      if (callCount === 2) return Promise.resolve({ confirm: true });
      return Promise.resolve({});
    });

    await restoreCommand();

    const content = await fs.readFile(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(content).toBe('# Original');
  });

  it('cancels when user declines confirmation', async () => {
    // Create backup
    await fs.ensureDir(path.join(tmpDir, '.claude'));
    await fs.writeFile(path.join(tmpDir, 'CLAUDE.md'), '# Original');
    await createBackup(tmpDir);

    // Modify
    await fs.writeFile(path.join(tmpDir, 'CLAUDE.md'), '# Modified');

    // Mock: select first backup, decline
    let callCount = 0;
    inquirer.prompt.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ selected: 0 });
      if (callCount === 2) return Promise.resolve({ confirm: false });
      return Promise.resolve({});
    });

    await restoreCommand();

    // File should still be modified
    const content = await fs.readFile(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(content).toBe('# Modified');
  });
});
