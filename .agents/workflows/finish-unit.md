---
description: Verify, document and close a Keraunous build unit
---

1. Run the full gate: lint, typecheck, unit tests, database tests, build (pnpm check). Fix failures at the root cause without weakening tests.
2. For UI units, verify in the browser at 390px and 1280px widths and capture screenshots.
3. Walk through the unit's Definition of done in docs/BLUEPRINT.md line by line and mark each item PASS or FAIL with evidence.
4. Update docs/PROGRESS.md: status, decisions made, deviations from the blueprint, follow-ups found, manual steps I must do.
5. If any shared contract in lib/contracts changed, add a CHANGELOG entry and confirm every consumer was updated.
6. Produce a Walkthrough artifact. List what I should test by hand.
7. Commit on the unit branch. Do not merge, push to main, or start another unit.
