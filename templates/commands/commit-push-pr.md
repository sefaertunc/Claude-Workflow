1. Update docs/spec/PROGRESS.md with what was completed this session
2. **Version bump (only when on `develop` targeting `main`):**
   - Check what changed since last version using the versioning policy in git-conventions.md
   - Template or CLI behavior changes → patch bump
   - New command/feature → minor bump
   - Breaking change → major bump
   - Only docs/CI/tests/PROGRESS.md → no bump needed
   - If bump needed: update `version` in package.json
3. Stage all changes: git add -A
4. Write a clear, conventional commit message
5. Push to the current branch
6. Create a PR with:
   - Clear title matching conventional commit format
   - Description of changes
   - Testing done
   - Any notes for reviewers

Branch targeting rules:

- Feature/bugfix branches → PR targets `develop` (`gh pr create --base develop`)
- When on `develop` → PR targets `main` (`gh pr create --base main`) — release merges only

Use `gh pr create` for PR creation.
