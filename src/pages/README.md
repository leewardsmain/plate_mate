# Pages

The `src/pages` directory contains the top-level route views for the PlateMate application. Each page is a composition of smaller, reusable UI and feature components.

## Available Pages

*   **`Home` (`/`)**: The main Activity Feed where users see a timeline of their friends' dining experiences.
*   **`Profile` (`/profile`)**: The personal dining CRM, showcasing the user's taste profile statistics and their own review ledger.
*   **`MyRestaurants` (`/my-restaurants`)**: A personalized list of saved restaurants built from friends' recommendations.
*   **`RestaurantView` (`/restaurant/:id`)**: The granular menu tracker for a specific restaurant, featuring "Circle Favorites", an "Avoid List", and personalized live metrics like "Visits this month" and "Top Dish".
*   **`Settings` (`/settings`)**: The user configuration page for updating public profiles and visibility settings.

## Styling Note

Each page is strictly styled using its respective Vanilla CSS Module (e.g., `Home.module.css`). Pages leverage global semantic CSS variables (`var(--bg-dark)`, `var(--glass-surface)`) defined in `src/index.css` to seamlessly support Light and Dark Modes without redundant CSS declarations.
