# Data Schemas & Conventions

This document outlines the data structures used in DynamoDB and S3.

## DynamoDB: platemate-reviews

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `reviewId` | String (PK) | Unique ID (e.g., `r_1708600000`) |
| `userId` | String | ID of the author |
| `author` | String | Display name of the author |
| `avatar` | String | URL to the author's profile picture |
| `restaurantName`| String | Name of the dining establishment |
| `text` | String | Overarching review text |
| `time` | String | Timestamp or relative time string |
| `likes` | Number | Count of likes |
| `likedBy` | List<String> | Array of user IDs who liked the review |
| `comments` | Number | Count of comments |
| `dishes` | List<Map> | Array of dish objects (id, name, price, sentiment, img) |

## DynamoDB: platemate-restaurants (New)

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `placeId` | String (PK) | Google Place ID (e.g., `ChIJN1t_tDeuEmsRUsoyG83frY4`) |
| `name` | String | Restaurant Name |
| `address` | String | Formatted Address |
| `rating` | Number | Google Rating |
| `user_ratings_total` | Number | Total Google Review Count |
| `customHeaderImage` | String | Custom S3 URL for header photo (optional) |
| `heroImage` | String | Google Places Photo URL (or custom fallback) |
| `lastUpdated` | String | ISO Timestamp of cache entry |

## DynamoDB: platemate-users

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `userId` | String (PK) | Unique user ID (e.g., `user_1`) |
| `name` | String | Display name |
| `handle` | String | @handle |
| `avatar` | String | Current profile picture URL |
| `bio` | String | User biography |
| `location` | String | User location string |
| `favCuisine` | String | Favorite cuisine selection |
| `reviewCount` | Number | Total count of reviews authored |
| `socialLinks` | Map | Keys for `instagram`, `twitter`, etc. |

## S3: Avatar Storage

- **Bucket**: `platemate-frontend-app`
- **Prefix**: `avatars/`
- **Naming Convention**: `avatars/{userId}/{timestamp}_{filename}`
- **Hosting**: Locally accessible at `http://localhost:4566/platemate-frontend-app/avatars/...`

## S3: Dish Photo Storage

- **Bucket**: `platemate-frontend-app`
- **Prefix**: `meal-photos/`
- **Naming Convention**: `meal-photos/{userId}/{timestamp}_{filename}`
- **Hosting**: Locally accessible at `http://localhost:4566/platemate-frontend-app/meal-photos/...`

## S3: Restaurant Header Storage

- **Bucket**: `platemate-frontend-app`
- **Prefix**: `restaurants/`
- **Naming Convention**: `restaurants/{placeId}/header_{timestamp}_{filename}`
- **Hosting**: Locally accessible at `http://localhost:4566/platemate-frontend-app/restaurants/...`
