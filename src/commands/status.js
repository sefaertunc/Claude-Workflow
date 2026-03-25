import path from 'node:path';
import { readWorkflowMeta, workflowMetaExists } from '../core/config.js';
import { hashFile } from '../utils/hash.js';
import { fileExists, readFile, listFilesRecursive } from '../utils/file.js';
import { TECH_STACKS } from '../data/agents.js';
import * as display from '../utils/display.js';

const TECH_DISPLAY_NAMES = Object.fromEntries(TECH_STACKS.map((t) => [t.value, t.name]));

function countByPrefix(fileHashes, prefix) {
  return Object.keys(fileHashes).filter((k) => k.startsWith(prefix)).length;
}

export async function statusCommand() {
  const projectRoot = process.cwd();

  if (!(await workflowMetaExists(projectRoot))) {
    display.info('Workflow is not installed. Run `worclaude init` to set up.');
    return;
  }

  const meta = await readWorkflowMeta(projectRoot);
  if (!meta) {
    display.error('workflow-meta.json is corrupted. Run `worclaude init` to reinstall.');
    return;
  }

  display.header('Worclaude Status');
  display.newline();

  // Version and dates
  display.dim(`  Version:      ${meta.version}`);
  display.dim(`  Installed:    ${meta.installedAt?.split('T')[0] || 'unknown'}`);
  display.dim(`  Last updated: ${meta.lastUpdated?.split('T')[0] || 'unknown'}`);
  display.newline();

  // Project info
  const projectTypes = (meta.projectTypes || []).join(', ');
  if (projectTypes) display.dim(`  Project type: ${projectTypes}`);

  const techNames = (meta.techStack || [])
    .map((t) => TECH_DISPLAY_NAMES[t] || t)
    .join(', ');
  if (techNames) display.dim(`  Tech stack:   ${techNames}`);
  display.newline();

  // Agents
  const universalCount = (meta.universalAgents || []).length;
  const optionalCount = (meta.optionalAgents || []).length;
  const totalAgents = universalCount + optionalCount;
  display.dim(`  Agents:       ${universalCount} universal + ${optionalCount} optional (${totalAgents} total)`);
  if (optionalCount > 0) {
    display.dim(`    Optional: ${meta.optionalAgents.join(', ')}`);
  }
  display.newline();

  // Commands and skills counts
  const commandCount = countByPrefix(meta.fileHashes || {}, 'commands/');
  const skillCount = countByPrefix(meta.fileHashes || {}, 'skills/');
  display.dim(`  Commands:     ${commandCount} installed`);
  display.dim(`  Skills:       ${skillCount} installed`);
  display.newline();

  // Customized files
  const customized = [];
  for (const [key, storedHash] of Object.entries(meta.fileHashes || {})) {
    const filePath = path.join(projectRoot, '.claude', ...key.split('/'));
    if (await fileExists(filePath)) {
      const currentHash = await hashFile(filePath);
      if (currentHash !== storedHash) {
        customized.push(`.claude/${key}`);
      }
    }
  }

  // Check CLAUDE.md separately
  const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
  if (await fileExists(claudeMdPath)) {
    // CLAUDE.md is always considered potentially customized
    customized.push('CLAUDE.md');
  }

  if (customized.length > 0) {
    display.info('Customized files (differ from installed version):');
    for (const f of customized) {
      display.dim(`    ~ ${f}`);
    }
    display.newline();
  }

  // Pending review files
  const pendingReview = [];
  try {
    const claudeDir = path.join(projectRoot, '.claude');
    const allFiles = await listFilesRecursive(claudeDir);
    for (const fp of allFiles) {
      const rel = path.relative(claudeDir, fp).split(path.sep).join('/');
      if (rel.endsWith('.workflow-ref.md')) {
        pendingReview.push(`.claude/${rel}`);
      }
    }
  } catch {
    // .claude dir might not exist
  }

  const suggestionsPath = path.join(projectRoot, 'CLAUDE.md.workflow-suggestions');
  if (await fileExists(suggestionsPath)) {
    pendingReview.push('CLAUDE.md.workflow-suggestions');
  }

  if (pendingReview.length > 0) {
    display.warn('Pending review:');
    for (const f of pendingReview) {
      display.dim(`    ⚠ ${f}`);
    }
    display.newline();
  }

  // Settings info
  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
  if (await fileExists(settingsPath)) {
    try {
      const raw = await readFile(settingsPath);
      const settings = JSON.parse(raw);

      const allow = settings.permissions?.allow || [];
      const permCount = allow.filter((p) => !p.trim().startsWith('//')).length;

      const hooks = settings.hooks || {};
      const hookCount = Object.values(hooks).reduce(
        (sum, entries) => sum + entries.length,
        0
      );

      display.dim(`  Hooks:        ${hookCount} active`);
      display.dim(`  Permissions:  ${permCount} rules`);
    } catch {
      display.dim('  Settings:     (could not parse settings.json)');
    }
  }
}
