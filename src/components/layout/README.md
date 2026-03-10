# Layout Components

The `src/components/layout` directory contains structural components responsible for the overarching shell of the application.

## `Layout.tsx`

The primary wrapper component for the entire authenticated application state.

### Responsibilities
*   **Responsive Shell**: Transitions from a bottom-tab navigation system on mobile to an expandable sidebar mechanism on desktop/tablet viewports.
*   **Global Navigation**: Handles routing links to the primary application views (Feed, Plates, Profile, Settings).
*   **Interactive Header**: Renders the persistent theme-toggle (Light/Dark mode) and notification/message icons.
*   **"Log Meal" Integration**: Serves as the global entry point for the `CreateReviewModal` feature, ensuring users can log an entry from anywhere in the application.

### State Dependencies
The `Layout` component interfaces with global Zustand stores (`useAppStore`) to control the visibility state of global modals, abstracting that complexity away from individual page routes.
