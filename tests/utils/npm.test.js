import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'node:child_process';
import { getLatestNpmVersion } from '../../src/utils/npm.js';

describe('getLatestNpmVersion', () => {
  afterEach(() => vi.clearAllMocks());

  it('returns trimmed version string on success', () => {
    execSync.mockReturnValue('1.2.5\n');
    expect(getLatestNpmVersion()).toBe('1.2.5');
  });

  it('returns null when npm command fails', () => {
    execSync.mockImplementation(() => {
      throw new Error('network error');
    });
    expect(getLatestNpmVersion()).toBeNull();
  });

  it('passes timeout option to execSync', () => {
    execSync.mockReturnValue('1.0.0');
    getLatestNpmVersion();
    expect(execSync).toHaveBeenCalledWith(
      'npm view worclaude version',
      expect.objectContaining({ timeout: 5000 })
    );
  });
});
