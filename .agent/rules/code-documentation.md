# Code Documentation Rule

## 1. Documentation Mandate
*   **Always Document New Code**: Whenever making edits to the frontend (React/TypeScript) or backend (Node.js/Lambda), you MUST update or create relevant documentation to reflect the new functionality.
*   **No Silent Features**: If a new feature, database field, API endpoint, or state management logic is added, it must exist in writing somewhere in the project's documentation files (e.g., `docs/DATA_SCHEMAS.md`, `README.md`, or architecture documents).

## 2. Frontend Updates
*   When editing React components, `Zustand` stores (`useAppStore.ts`), or API service layers (`api.ts`), ensure the component architecture or state tree documentation is updated to reflect new actions, state variables, or UI flows.
*   Provide JSDoc-style comments for complex new utility functions.

## 3. Backend Updates
*   When adding new AWS Lambda endpoints or modifying DynamoDB schemas, you MUST update `docs/DATA_SCHEMAS.md` or equivalent API route documentation.
*   Clearly map out any new required Request/Response bodies, path parameters, and query parameters.

## 4. Definition of Done
*   A coding task is only considered "Complete" if the accompanying documentation has been proactively written and saved alongside the code changes.
