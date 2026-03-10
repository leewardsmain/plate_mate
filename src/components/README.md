# Components

The `src/components` directory houses all reusable React components that make up the PlateMate interface.

Components are organized into specialized subdirectories based on their complexity and domain:

*   **[`/layout`](./layout/README.md)**: Major structural components that frame the application (e.g., Navigation, Page Shells).
*   **[`/features`](./features/README.md)**: Complex, domain-specific components with heavy business logic or state integration (e.g., Create Review workflows).
*   **[`/ui`](./ui/README.md)**: Dumb, highly-reusable, pure presentational components (e.g., Buttons, Avatars, core structural Cards).

By strictly adhering to this hierarchy, PlateMate maintains a highly modular and maintainable frontend architecture.
