# Local Development with LocalStack

To emulate our AWS Infrastructure locally without incurring costs or waiting on cloud deployments, PlateMate uses **LocalStack**. 

This guide explains how to spin up our local "AWS Cloud" and deploy our CloudFormation stack to it.

## Prerequisites

1.  **Docker Desktop** (or Docker Engine + Docker Compose) installed and running.
2.  **AWS CLI** installed.
3.  **LocalStack AWS CLI wrapper (`awslocal`)** installed:
    ```bash
    pip install awscli-local
    ```
    *(This is simply a wrapper around `aws` that automatically points all commands to `http://localhost:4566`)*

## 1. Starting the Local Cloud

The `docker-compose.yml` file in the root directory defines the LocalStack container and specifies which AWS services to emulate.

To start the local infrastructure, open a terminal and run:

```bash
docker-compose up -d
```

This will run LocalStack in detached mode. You can verify the container is running with `docker ps`.

**Services currently emulated natively:**
*   S3
*   CloudFront
*   DynamoDB
*   API Gateway
*   Lambda
*   Cognito (Note: advanced Cognito features might require the Pro version of LocalStack, but basic user pools and standard auth flows often work on the free tier).

## 2. Deploying Infrastructure (IaC) Locally

We provide an automated script to package and deploy everything (Lambda, S3, CloudFormation) in one go:

```powershell
./deploy-local.ps1
```

This script will:
1. Zip the Lambda logic in `lambda/`.
2. Upload it to the local S3 bucket.
3. Deploy the `template.yaml`.
4. Output your `VITE_API_URL`.

For manual deployment or detailed resource troubleshooting, see [INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md).

## 3. Inspecting & Testing Local Backend Resources

You can interact with your local AWS services just as you would real ones, simply by replacing `aws` with `awslocal`.

### Testing S3
*   List local S3 buckets:
    ```bash
    awslocal s3 ls
    ```

### Testing DynamoDB
*   List local DynamoDB tables:
    ```bash
    awslocal dynamodb list-tables
    ```
*   Put a mock item into the Users table:
    ```bash
    awslocal dynamodb put-item \
      --table-name platemate-users \
      --item '{"userId": {"S": "test-user-123"}, "name": {"S": "Chef Local"}}'
    ```
*   Read the item back:
    ```bash
    awslocal dynamodb get-item \
      --table-name platemate-users \
      --key '{"userId": {"S": "test-user-123"}}'
    ```

### Testing Lambda & API Gateway
*   Invoke the Lambda function directly:
    ```bash
    awslocal lambda invoke \
      --function-name platemate-api-handler \
      response.json
    cat response.json
    ```
*   Test the API Gateway endpoint via HTTP:
    First, get the locally generated API endpoint URL from the CloudFormation outputs:
    ```bash
    awslocal cloudformation describe-stacks \
      --stack-name platemate-local-stack \
      --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
      --output text
    ```
    Then, simply hit that URL:
    ```bash
    curl -X POST <YOUR_API_ENDPOINT_URL>
    ```

## 4. Connecting the Frontend

Once your LocalStack infrastructure is running and the CloudFormation stack is deployed, you need to tell your local React application to talk to the local API instead of the production one.

1.  Get your `ApiEndpoint` URL from the CloudFormation outputs (see Step 3).
2.  In the root of the project (where `package.json` is), create a file named `.env.local` (this file is ignored by git).
3.  Add the following line, replacing the URL with your actual endpoint:

```env
VITE_API_URL=http://localhost:4566/restapis/<YOUR_API_ID>/dev/_user_request_/
```

Now, when you run `npm run dev`, Vite will expose this variable to the application as `import.meta.env.VITE_API_URL`.

### Testing the Integration

To verify the connection:
1.  Start the frontend: `npm run dev`
2.  Open your browser and navigate to `http://localhost:5173`
3.  Open the developer console (F12).
4.  Log a new meal using the "Log Meal" button.
5.  In the console, you should see:
    *   `Sending review to local API: http://localhost:4566/restapis/...`
    *   `Local API Success: {message: "Hello from PlateMate Local Lambda!", dbAccess: "Granted"}` 

### Running API Integration Tests

To comprehensively test that your LocalStack backend API endpoints are functioning properly without having to use the frontend UI, run the Vitest integration suite:

```bash
npm test tests/api_integration.test.ts
```

This automated suite tests all endpoints spanning Users, Restaurants, and Reviews against your locally running API Gateway and DynamoDB instances, and it verifies that AWS services such as S3 presigned URL generation behave correctly locally.

## 5. Shutting Down

To stop the LocalStack container and remove the emulated infrastructure:

```bash
docker-compose down
```

*Note: Depending on how your volume mounts are configured in `docker-compose.yml`, data in S3 and DynamoDB might persist across restarts, or it may be wiped clean every time you spin the container down. Currently, data persists to the `./volume` directory.*
