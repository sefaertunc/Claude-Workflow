import { readWorkflowMeta, workflowMetaExists, getPackageVersion } from '../core/config.js';
import { categorizeFiles } from '../core/file-categorizer.js';
import * as display from '../utils/display.js';

export async function diffCommand() {
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

  const categories = await categorizeFiles(projectRoot, meta);

  display.header('Worclaude Diff');
  display.newline();
  display.dim(`  Comparing current setup to workflow v${meta.version}:`);
  display.newline();

  let hasChanges = false;

  if (categories.modified.length > 0) {
    hasChanges = true;
    display.info('Modified (your changes):');
    for (const { key } of categories.modified) {
      display.dim(`    ~ .claude/${key}`);
    }
    display.newline();
  }

  if (categories.deleted.length > 0) {
    hasChanges = true;
    display.info('Deleted (removed since install):');
    for (const { key } of categories.deleted) {
      display.dim(`    - .claude/${key}`);
    }
    display.newline();
  }

  if (categories.userAdded.length > 0) {
    hasChanges = true;
    display.info('Extra (you added):');
    for (const { key } of categories.userAdded) {
      display.dim(`    + .claude/${key}`);
    }
    display.newline();
  }

  if (categories.outdated.length > 0) {
    hasChanges = true;
    const cliVersion = await getPackageVersion();
    display.info(`Outdated (newer version available in CLI v${cliVersion}):`);
    for (const { key } of categories.outdated) {
      display.dim(`    ↑ .claude/${key}`);
    }
    display.newline();
  }

  display.dim(`  Unchanged: ${categories.unchanged.length} files`);

  if (!hasChanges) {
    display.newline();
    display.success('No changes detected.');
  }

  if (categories.outdated.length > 0) {
    display.newline();
    display.info('Run `worclaude upgrade` to update outdated files.');
  }
}
