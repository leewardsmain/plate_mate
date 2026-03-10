# API Reference

The PlateMate API is a RESTful service hosted via AWS API Gateway and Lambda.

**Base URL**: `http://localhost:4566/restapis/<api-id>/dev/_user_request_`

## Reviews

### GET /reviews
Fetch all reviews in the system.
- **Returns**: `200 OK` with an array of `DiningEvent` objects.

### POST /reviews
Create a new dining review.
- **Request Body**: Partial or full `DiningEvent` object.
- **Returns**: `201 Created`

### DELETE /reviews/{id}
Delete a specific review.
- **Path Parameters**: `id` (The `reviewId`)
- **Returns**: `200 OK`

### POST /reviews/{id}/like
Toggle a like for a review.
- **Path Parameters**: `id` (The `reviewId`)
- **Request Body**: `{ "userId": "string" }`
- **Returns**: `200 OK` with updated `{ likedBy, likes }`.

### POST /reviews/{id}/comments
Add a comment to a review.
- **Path Parameters**: `id` (The `reviewId`)
- **Request Body**: `{ "author": "string", "text": "string" }`
- **Returns**: `200 OK`

## Users

### GET /users/{id}
Fetch public profile for a user.
- **Path Parameters**: `id` (The `userId`)
- **Returns**: `200 OK` with `UserProfile` object.

### PUT /users/{id}
Update user profile details.
- **Path Parameters**: `id` (The `userId`)
- **Request Body**: `Partial<UserProfile>`
- **Returns**: `200 OK`

### POST /users/{id}/avatar
Generate a presigned URL to upload a profile avatar.
- **Path Parameters**: `id` (The `userId`)
- **Request Body**: `{ "fileName": "string", "contentType": "string" }`
- **Returns**: `200 OK` with `{ uploadUrl, publicUrl, key }`.

---

## Global Headers
All responses include:
- `Access-Control-Allow-Origin: *`
- `Content-Type: application/json`
