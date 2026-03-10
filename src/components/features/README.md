# Feature Components

The `src/components/features` directory contains complex, domain-specific components that handle significant business logic or global state mutations.

## `CreateReviewModal.tsx`

The core orchestration component for logging new meals into the PlateMate ecosystem.

### Key Features
*   **Multi-step Workflow**: Guides the user through selecting a restaurant, adding specific dishes, and attaching sentiments.
*   **State Manipulation**: Interfaces heavily with `useAppStore` to append new reviews globally across the application, immediately updating the Activity Feed and User Profile ledgers.
*   **Dynamic UI**: Includes granular "Love It" / "Leave It" sentiment togglers and mock photo upload zones.

*Unlike `ui/` components which are dumb and presentational, feature components are tightly coupled to the application's domain logic.*
