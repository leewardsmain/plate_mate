# Plate Mate - Interactive Elements & API Mapping

This document provides a detailed log of all primary user interactions (buttons, forms, and actions) within the Plate Mate application, along with the corresponding backend API integration.

## 1. Global Interactions

| Action | UI Element | Store Method | API Endpoint | Description |
|--------|------------|--------------|--------------|-------------|
| **Log a Meal** | FAB / Navbar Button | `openCreateReviewModal()` | N/A (UI State) | Opens the multi-step review creation modal. |
| **Toggle Theme** | Navbar Icon | `toggleTheme()` | N/A (Local) | Switches between Light and Dark modes; persists in `data-theme` attribute. |
| **Show Toasts** | Automated | `addToast()` | N/A (UI State) | Displays feedback messages (Success/Error/Info). |

---

## 2. Activity Feed (Home Page)

| Action | UI Element | Store Method | API Endpoint | Description |
|--------|------------|--------------|--------------|-------------|
| **Like Review** | Heart Icon | `toggleLike(id)` | `POST /reviews/{id}/like` | Toggles user's ID in the `likedBy` array of the review. |
| **View Comments** | Bubble Icon | `setOpenCommentId(id)` | N/A (UI State) | Expands the comment panel for a specific review. |
| **Add Comment** | Submit Button | `addComment(id, text)` | `POST /reviews/{id}/comments` | Appends a new comment to the review's `commentsList`. |
| **Edit Review** | Context Menu > Edit | `openEditModal(id)` | N/A (UI State) | Opens the edit modal for a review owned by the current user. |
| **Delete Review** | Context Menu > Delete | `deleteReview(id)` | `DELETE /reviews/{id}` | Permanently removes the review from DynamoDB. |
| **Share Review** | Share Icon | `addToast()` | N/A (Mock) | Simulates sharing the review (currently triggers a success toast). |

---

## 3. Restaurant Details

| Action | UI Element | Store Method | API Endpoint | Description |
|--------|------------|--------------|--------------|-------------|
| **Log a Meal** | "Log a Meal" Button | `openCreateReviewModal(id)` | N/A (UI State) | Opens review modal pre-populated with the current restaurant. |
| **Save Restaurant**| "Add to My Restaurants" | `toggleSavedRestaurant(id)` | `PUT /users/{id}` | Updates the `savedRestaurants` array in the user's profile. |
| **Update Header** | Photo Icon (Hero) | `uploadRestaurantHeader(id, file)` | `POST /restaurants/{id}/photo-url` | Gets S3 presigned URL, uploads file, and updates restaurant's `customHeaderImage`. |
| **Directions** | "Open in Maps" | N/A | External (Google Maps) | Opens Google Maps with the restaurant's name and address. |
| **Edit Dish** | Ledger Item Click | `openEditModal(eventId, dishId)` | N/A (UI State) | Allows quick editing of a specific dish rating/sentiment from the ledger. |

---

## 4. Review Modals (Create / Edit)

| Action | UI Element | Store Method | API Endpoint | Description |
|--------|------------|--------------|--------------|-------------|
| **Submit Review** | "Post Review" | `addReview(data)` | `POST /reviews` | Creates a new DynamoDB record; also auto-saves the restaurant to user profile. |
| **Save Changes** | "Update" | `updateReview(id, data)` | `PUT /reviews/{id}` | Updates existing review text and dish details. |
| **Delete Dish** | "Remove" (Edit Modal) | `updateReview(...)` | `PUT /reviews/{id}` | Removes a dish from the `dishes` array during editing. |
| **Dish Sentiment** | Love/Leave Toggle | Local State | N/A | Toggles the `love` or `leave` sentiment for a dish before submission. |

---

## 5. User Settings & Profile

| Action | UI Element | Store Method | API Endpoint | Description |
|--------|------------|--------------|--------------|-------------|
| **Update Profile** | "Save Changes" | `updateCurrentUser(data)` | `PUT /users/{id}` | Updates name, handle, bio, location, social links, and food tags. |
| **Update Avatar** | "Upload New" | `updateUserAvatar(file)` | `POST /users/{id}/avatar` | Gets S3 presigned URL, uploads file, and updates user profile's `avatar`. |
| **Remove Avatar** | "Remove" | `updateUserAvatar(null)` | `PUT /users/{id}` | Resets avatar to default placeholder. |
| **Reset Password** | "Change Password" | N/A | `POST /forgot-password` | Triggers Cognito's forgot password flow. |
| **Accent Color** | Color Swatch | `setAccentColor(hex)` | N/A (Local) | Updates CSS variables (`--primary`) and persists in LocalStorage. |
| **Delete Account** | "Delete Account" | `deleteAccount()` | `DELETE /users/{id}` | Deletes data from DynamoDB and removes user from Cognito. |

---

## 6. Search & Discovery

| Action | UI Element | Store Method | API Endpoint | Description |
|--------|------------|--------------|--------------|-------------|
| **Search** | Search Input / Icon | `searchRestaurants(q, loc)`| `GET /restaurants/search` | Proxies to Google Places Text Search. Automatically routes coordinates to native location parameters. |
| **Use My Location**| Location Icon | N/A (Browser API) | N/A | Requests browser geolocation to refine search context (zip code or coordinates). |
| **Select Result** | Result Card | `fetchRestaurantDetails(id)`| `GET /restaurants/{id}` | Fetches full details and caches them in DynamoDB. |
