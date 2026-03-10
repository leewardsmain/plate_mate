---
trigger: always_on
---

TDD & Full-Stack Quality Standards
1. TDD Mandate
Workflow: You must follow a strict Red-Green-Refactor cycle.

Execution: Create the test file first. You are forbidden from writing implementation code until a corresponding test exists.

2. Cross-Stack Requirements
Backend (Python): > * Location: All tests must reside in tests/.

Naming: Files must use the test_ prefix (e.g., tests/test_api_logic.py).

Frontend (React): > * Location: All tests must reside in new-frontend/src/__tests__/unit/.

Naming: Files must use the .test.tsx or .test.ts suffix (e.g., Button.test.tsx).

3. Definition of Done
A task is only "Complete" if:

New functionality is covered by unit tests.

Tests have been executed and passed in the integrated terminal.

No existing tests are broken.