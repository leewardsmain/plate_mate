# UI Components

The `src/components/ui` directory is the atomic design library for PlateMate. It contains "dumb", highly-reusable, and pure presentational components.

These components do not interface with global stores (`useAppStore`) and rely entirely on passed `props` for rendering.

## Component Library

*   **`Avatar`**: A standardized user profile image component.
*   **`Button`**: The primary click-action component, supporting multiple variants (primary, ghost) and icons.
*   **`Card`**: A flexible foundational container representing the application's core "Frosted Glass" aesthetic.
*   **`Modal`**: A generic abstraction for overlay dialogs, handling backdrop clicks and exit animations, utilized by feature-specific modals (like `CreateReviewModal`).

## Styling Pattern

All UI components are styled using independent Vanilla CSS Modules (e.g., `Button.module.css`). They are intentionally generic to ensure they can be repurposed seamlessly across different views and contexts.
