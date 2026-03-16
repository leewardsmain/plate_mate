---
name: Test Locally
description: How to test the PlateMate app locally by creating an account and logging in.
---

# Testing Locally

When testing the application locally, you must create a new account each time to verify end-to-end functionality correctly because the local mock database might be reset or in an inconsistent state.

## Steps

1. Navigate to the local server URL (usually `http://localhost:5173`).
2. Click on the "Sign Up" or "Create Account" option in the UI.
3. Fill out the required registration details (email, password, etc.). **CRITICAL: You MUST explicitly clear out and delete any pre-filled mock/example data in EVERY input field before typing your own text, otherwise the application will reject your input.**
4. When prompted for an email confirmation code, you must enter `123456`.
5. Complete the sign-up process and ensure you are routed to the logged-in state of the app.
6. Proceed to test the requested features (e.g., UI layout, routing, posting reviews).
