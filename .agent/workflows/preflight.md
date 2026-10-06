---
description: Run step P0 preflight checks and update docs/PREFLIGHT.md
---

# /preflight Workflow (Step P0)

Execute the standard preflight verification sequence before starting an implementation unit:

1. **Check Environment**:
   - Inspect active node/python/toolchain versions.
   - Verify package dependencies and lockfiles.

2. **Verify Baseline**:
   - Run typechecks and linters.
   - Run existing unit test suites.

3. **Update Documentation**:
   - Fill in environment details and test outputs in `docs/PREFLIGHT.md`.
   - Update `docs/PROGRESS.md` to reflect preflight verification status.
