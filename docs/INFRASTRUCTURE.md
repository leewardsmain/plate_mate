# Infrastructure & LocalStack Setup

PlateMate uses a serverless architecture designed for AWS, emulated locally using **LocalStack**.

## Core Components

| Component | Service | Purpose |
| :--- | :--- | :--- |
| **Frontend** | S3 + CloudFront | Serves the Vite React application. |
| **API Backend** | Lambda + API Gateway | Node.js handler for CRUD operations. |
| **Database** | DynamoDB | NoSQL storage for Reviews and User Profiles. |
| **Storage** | S3 | Object storage for User Avatars. |

## Local Infrastructure (template.yaml)

The `template.yaml` (CloudFormation/SAM) defines the following resources:

### DynamoDB Tables
- `platemate-users`: PK `userId` (String). Stores profile metadata.
- `platemate-reviews`: PK `reviewId` (String). Stores review content, dishes, and interaction data.
  - GSI: `UserReviewsIndex` (PK `userId`) for fetching a specific user's feed.

### Lambda Function
- **Handler**: `platemate-api-handler`
- **Source**: `lambda/index.js`
- **Runtime**: Node.js 20.x
- **IAM**: Permissions to scan/query/put/delete in DynamoDB.

### API Gateway
- **Type**: REST API (v1)
- **Path**: Proxy resource `{proxy+}` routing all traffic to the Lambda.
- **Endpoint**: `http://localhost:4566/restapis/<api-id>/dev/_user_request_`

## Local Deployment

Use the provided PowerShell script to deploy the stack to LocalStack:

```powershell
./deploy-local.ps1
```

**What the script does:**
1. Zips `lambda/index.js` into `lambda.zip`.
2. Creates the `platemate-frontend-app` S3 bucket.
3. Uploads the zip file to the bucket (`s3://platemate-frontend-app/lambda.zip`).
4. Checks `.env.local` for `GOOGLE_API_KEY`. If found, sets `UseMockData=false` so local search uses live Google data.
5. Deploys the `template.yaml` using `awslocal cloudformation deploy`, passing `UseMockData` and `GoogleApiKey` parameters.
6. Outputs the deterministic API Gateway URL and automatically updates `VITE_API_URL` in `.env.local`.

## Environment Variables

Edit `.env.local` to point the frontend to your local backend and optionally set your Google API key:

```env
VITE_API_URL=http://localhost:4566/restapis/<api-id>/Prod/_user_request_
GOOGLE_API_KEY=your_actual_google_places_api_key
```
