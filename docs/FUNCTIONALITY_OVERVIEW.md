# Plate Mate - Functionality Overview

Plate Mate is a social dining application designed for food enthusiasts to discover restaurants, log their culinary experiences, and share reviews within a social circle.

## 1. Core Architecture

- **Frontend**: React (TypeScript), Vite, Zustand (State Management), React Router.
- **Backend**: AWS Lambda (Node.js) acting as a REST API.
- **Storage**: 
  - **DynamoDB**: Stores user profiles, dining reviews, and a cache of restaurant data.
  - **S3**: Stores user avatars, dish photos, and custom restaurant header images.
- **Third-Party Integrations**:
  - **AWS Amplify**: Handles authentication flows (Cognito).
  - **Google Places API**: Powers restaurant search, details, and photos.
- **Local Development**: LocalStack is used to emulate AWS services (Lambda, DynamoDB, S3, SQS).

---

## 2. Key Modules & Features

### 2.1 Authentication & User Identity
- **Flows**: Sign Up, Login, Email Verification, and Password Recovery.
- **Account Management**: Users can update their profile information and delete their account (which cleans up both Cognito and DynamoDB records).
- **Protected Routes**: Core application features are restricted to authenticated users.

### 2.2 Social Feed (Home)
- **Activity Stream**: Displays a chronological feed of dining events (reviews) from the community.
- **Interactions**:
  - **Liking**: Users can toggle "likes" on any review.
  - **Commenting**: Users can leave text comments on reviews.
- **Management**: Users can edit or delete their own reviews directly from the feed.

### 2.3 Restaurant Discovery
- **Search**: Search for restaurants by name, zip code, or geographic coordinates using the Google Places API.
- **Results**: View a list of matching restaurants with key info (rating, address, price level).
- **Details View**: Deep dive into a restaurant to see:
  - High-quality photos.
  - Contact info (Phone, Website).
  - Operating hours.
  - Community reviews for that specific location.
- **Saving**: Toggle a "Save" status to keep track of favorite spots or places to visit.

### 2.4 Logging Dining Events (Reviews)
- **Multi-Dish Reviews**: A single dining event can include multiple dishes.
- **Dish Details**: Each dish can have a name, price, rating, and a "Sentiment" (Love it or Leave it).
- **Media**: (Implemented/Planned) Support for uploading photos of the meal.
- **Auto-Save**: Reviewing a restaurant automatically adds it to the user's "Saved Restaurants" list.

### 2.5 User Profile
- **Personalization**: Users can set a bio, location, and "Favorite Cuisine".
- **Food Tags**: Tag interests (e.g., "Sushi", "Spicy", "Vegan") to personalize the profile.
- **Social Links**: Link to Instagram, Twitter, TikTok, etc.
- **Stats**: Displays review count and follower count.
- **Avatar**: Upload a custom profile picture stored in S3.

### 2.6 Personalization & UI
- **Themes**: Toggle between Light and Dark modes.
- **Accent Colors**: Users can select a custom primary color for the UI, which persists via LocalStorage.
- **Toasts**: Real-time feedback for actions (e.g., "Review Saved", "Profile Updated").

---

## 3. Data Models

### 3.1 User Profile
```typescript
{
    userId: string;
    email: string;
    name: string;
    handle: string;
    avatar: string;
    bio: string;
    location: string;
    favCuisine: string;
    savedRestaurants: string[]; // List of Google Place IDs
    foodTags: string[];
    socialLinks: { instagram, twitter, tiktok, youtube, website };
}
```

### 3.2 Dining Event (Review)
```typescript
{
    reviewId: string;
    author: string;
    avatar: string;
    restaurantId: string;
    restaurantName: string;
    location: string;
    time: string;
    text: string;
    likes: number;
    comments: number;
    dishes: DishReview[];
    likedBy: string[]; // List of user IDs
    commentsList: Comment[];
}
```

### 3.3 Dish Review
```typescript
{
    id: string;
    name: string;
    price: string;
    rating: number;
    sentiment: 'love' | 'leave' | 'none';
    img: string;
}
```

---

## 4. API Endpoints (Lambda Proxy)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/reviews` | Fetch all reviews for the feed |
| POST | `/reviews` | Create a new dining event |
| DELETE | `/reviews/{id}` | Delete a specific review |
| POST | `/reviews/{id}/like` | Toggle like on a review |
| POST | `/reviews/{id}/comments` | Add a comment to a review |
| GET | `/users/{id}` | Fetch a user's profile |
| PUT | `/users/{id}` | Update user profile data |
| POST | `/users/{id}/avatar` | Get presigned URL for avatar upload |
| GET | `/restaurants/search` | Proxy to Google Places Text Search |
| GET | `/restaurants/{id}` | Proxy to Google Places Details |
| PUT | `/restaurants/{id}` | Update cached restaurant info (e.g. custom header) |
