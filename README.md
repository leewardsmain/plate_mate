# PlateMate 🍽️

PlateMate is a Social Dining Ledger that focuses on dish-level tracking and collaborative reviews. Unlike traditional restaurant review apps that aggregate ambiguous star ratings, PlateMate lets you see exactly what your friends ordered, whether they loved it or hated it, and what you should order next time.

## 🚀 Features

- **Social Discovery Feed**: A timeline of your friends' recent dining experiences, including the specific dishes they ordered, photos, and sentiments.
- **Granular Menu Tracking**: Restaurant profiles that highlight "Love It" and "Leave It" dishes, pulling real-time aggregate data from your network.
- **Google Places Integration**: Native search powered by Google Places API, pulling accurate restaurant details, locations, and high-quality hero images.
- **Frictionless Meal Logging**: Quickly log a meal by searching for a venue, uploading photos of dishes (stored securely in AWS S3), and assigning a simple "Love it" or "Leave it" sentiment.
- **Personal Dining CRM**: A private ledger of everywhere you've eaten, your taste profile statistics, and curated "My Restaurants" tracking with editable past meals.
- **Modern UI/UX**: Designed with a sleek, dark-mode-first glassmorphism aesthetic using Vanilla CSS modules and custom React Modals.

## 📖 Project Structure & Documentation

To maintain a clean and scalable frontend architecture, PlateMate is rigorously organized. Detailed documentation for specific domains can be found in their respective directories:

*   **[Pages (`src/pages`)](./src/pages/README.md)**: Top-level route views (Home, Profile, Settings, etc.).
*   **[Components (`src/components`)](./src/components/README.md)**: The core building blocks of the interface.
    *   **[Layout (`src/components/layout`)](./src/components/layout/README.md)**: Structural shells and global navigation matrices.
    *   **[Features (`src/components/features`)](./src/components/features/README.md)**: Complex domain logic components and multi-step workflows.
    *   **[UI (`src/components/ui`)](./src/components/ui/README.md)**: Atomic, highly-reusable, pure presentational elements.

## 🛠️ Tech Stack & Architecture

This application is built as a highly interactive React frontend connected to a fully serverless AWS backend (Lambda, DynamoDB, S3) running locally via **LocalStack**.

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Language**: TypeScript (Strict Mode)
- **Styling**: Vanilla CSS Modules (CSS Variables, Flexbox/Grid, native CSS nesting)
- **State Management**: Zustand (Global UI states, Caching, and optimistic updates)
- **Routing**: React Router DOM v7
- **Testing**: Vitest & React Testing Library

### Backend (Serverless via LocalStack)
- **API**: AWS API Gateway
- **Compute**: AWS Lambda (`lambda/index.js`) handling proxy requests and database reads/writes.
- **Database**: AWS DynamoDB (`platemate-users`, `platemate-reviews`, `platemate-restaurants`)
- **Storage**: AWS S3 for secure, pre-signed URL uploads of User Avatars, Meal Photos, and Custom Restaurant Headers.
- **External APIs**: Google Places API (Text Search, Place Details, Place Photos)

## 📦 Getting Started

### Prerequisites

Ensure you have Node.js (v18+ recommended) and `npm` installed.

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development Server

Run the local Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The frontend application will be available at `http://localhost:5173`. 

### LocalStack Backend Setup

To run the backend infrastructure locally, you must have Docker Desktop installed.

1. Start LocalStack:
   ```bash
   docker-compose up -d
   ```
2. Deploy the infrastructure (DynamoDB tables, S3 Buckets, Lambda functions, API Gateway):
   ```bash
   npm run deploy-local
   # Or run the powershell script directly: .\deploy-local.ps1
   ```
3. The API will be available at `http://localhost:4566/restapis/...`

*Note: You must supply a valid `GOOGLE_API_KEY` in `.env.local` or `template.yaml` for the restaurant search to return live data. Otherwise, the app falls back to mock Google payloads.*

## 🧪 Testing

The project utilizes `vitest` coupled with `@testing-library/react` for ensuring component reliability under strict Test-Driven Development (TDD) principles.

To run the unit and integration test suite:

```bash
npm test
```

Test files are strictly located in:
- `src/__tests__/unit/` for frontend unit tests.
- `tests/` for backend API integration tests (`api_integration.test.ts`).

## 🏗️ Production Build

To create an optimized production build:

```bash
npm run build
```

This command will first run `tsc -b` to rigorously type-check the codebase, followed by `vite build` to bundle the optimized static assets into the `dist/` folder.

## 🚢 Deployment & CI/CD

Deployment is configured via GitHub Actions. The `.github/workflows/deploy.yml` pipeline will automatically:
1. Run linting (`eslint`) and unit tests (`vitest`).
2. Build the production bundle.
3. Sync the `dist/` directory to an AWS S3 bucket.
4. Invalidate the AWS CloudFront cache to serve the latest version globally.

*A `docker-compose.yml` file is also included utilizing `LocalStack` to simulate the AWS S3/CloudFront infrastructure locally for testing infrastructure changes.*
