$ENDPOINT = "http://localhost:4566"
$CODE_BUCKET = "platemate-code-local"

Write-Host "--- Packaging Lambda ---" -ForegroundColor Cyan
if (Test-Path "lambda.zip") { Remove-Item "lambda.zip" }
Compress-Archive -Path "lambda/*" -DestinationPath "lambda.zip"

Write-Host "--- Checking LocalStack Status ---" -ForegroundColor Cyan
try {
    aws s3 ls --endpoint-url $ENDPOINT | Out-Null
}
catch {
    Write-Error "LocalStack is not reachable at $ENDPOINT. Please start it with 'docker-compose up'."
    exit 1
}

Write-Host "--- Preparing S3 Bucket for Code ---" -ForegroundColor Cyan
aws s3 mb s3://$CODE_BUCKET --endpoint-url $ENDPOINT 2>$null

# Wait for bucket to be ready
$retry = 0
while ($retry -lt 10) {
    if (aws s3api head-bucket --bucket $CODE_BUCKET --endpoint-url $ENDPOINT 2>$null) {
        Write-Host "Bucket $CODE_BUCKET is ready." -ForegroundColor Green
        break
    }
    Write-Host "Waiting for bucket $CODE_BUCKET (retry $($retry+1))..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
    $retry++
}

# Apply CORS to bucket
New-Item -Path "cors.json" -ItemType "file" -Value '{"CORSRules":[{"AllowedHeaders":["*"],"AllowedMethods":["PUT","GET","POST"],"AllowedOrigins":["*"],"ExposeHeaders":[]}]}' -Force | Out-Null
aws s3api put-bucket-cors --bucket $CODE_BUCKET --cors-configuration file://cors.json --endpoint-url $ENDPOINT

# 1. Package the template (handles zipping ./lambda and uploading to S3)
Write-Host "--- Packaging Template ---" -ForegroundColor Cyan
aws cloudformation package `
    --template-file template.yaml `
    --s3-bucket $CODE_BUCKET `
    --output-template-file packaged.yaml `
    --endpoint-url $ENDPOINT

# 2. Deploy the packaged template
Write-Host "--- Deploying CloudFormation Stack ---" -ForegroundColor Cyan

# Load from .env.local if available
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^GOOGLE_API_KEY=(.*)") {
            $env:GOOGLE_API_KEY = $matches[1].Trim()
        }
    }
}

$googleKey = $env:GOOGLE_API_KEY
$useMock = "true"

if ($googleKey) {
    $useMock = "false"
    Write-Host "GOOGLE_API_KEY detected. Live restaurant lookup ENABLED." -ForegroundColor Green
} else {
    Write-Host "GOOGLE_API_KEY not found. Falling back to MOCK data for restaurants." -ForegroundColor Yellow
}

aws --no-cli-pager cloudformation deploy `
    --stack-name platemate-local-v2 `
    --template-file packaged.yaml `
    --capabilities CAPABILITY_NAMED_IAM `
    --endpoint-url $ENDPOINT `
    --parameter-overrides GoogleApiKey="$googleKey" UseMockData="$useMock"


Write-Host ""
Write-Host "--- Deployment Complete ---" -ForegroundColor Green

# Fetch the API ID directly for reliable routing
$apiId = aws apigateway get-rest-apis --query "items[0].id" --output text --endpoint-url $ENDPOINT

if (-not $apiId -or $apiId -eq "None") {
    Write-Error "Failed to retrieve API ID."
    exit 1
}

$apiUrl = "http://localhost:4566/restapis/$apiId/Prod/_user_request_"

Write-Host "Your Local API URL is: " -NoNewline
Write-Host $apiUrl -ForegroundColor Yellow

# Update .env.local automatically
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local"
    $apiUrl = $apiUrl.TrimEnd('/')
    $newEnvContent = $envContent | ForEach-Object {
        if ($_ -match "VITE_API_URL=") { "VITE_API_URL=$apiUrl" } else { $_ }
    }
    # If VITE_API_URL wasn't found, add it
    if (-not ($envContent -match "VITE_API_URL=")) {
        $newEnvContent += "VITE_API_URL=$apiUrl"
    }
    $newEnvContent | Set-Content ".env.local"
    Write-Host "Updated .env.local with new API URL." -ForegroundColor Gray
}
else {
    "VITE_API_URL=$apiUrl" | Set-Content ".env.local"
    Write-Host "Created .env.local with new API URL." -ForegroundColor Gray
}

