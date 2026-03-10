$ENDPOINT = "http://localhost:4566"

Write-Host "--- Packaging Lambda ---" -ForegroundColor Cyan
if (Test-Path "lambda.zip") { Remove-Item "lambda.zip" }
Compress-Archive -Path "lambda/index.js" -DestinationPath "lambda.zip"

Write-Host "--- Checking LocalStack Status ---" -ForegroundColor Cyan
try {
    aws s3 ls --endpoint-url $ENDPOINT | Out-Null
}
catch {
    Write-Error "LocalStack is not reachable at $ENDPOINT. Please start it with 'docker-compose up'."
    exit 1
}

Write-Host "--- Preparing S3 Bucket for Code ---" -ForegroundColor Cyan
aws s3 mb s3://platemate-frontend-app --endpoint-url $ENDPOINT 2>$null

# Apply CORS to bucket
New-Item -Path "cors.json" -ItemType "file" -Value '{"CORSRules":[{"AllowedHeaders":["*"],"AllowedMethods":["PUT","GET","POST"],"AllowedOrigins":["*"],"ExposeHeaders":[]}]}' -Force | Out-Null
aws s3api put-bucket-cors --bucket platemate-frontend-app --cors-configuration file://cors.json --endpoint-url $ENDPOINT

Write-Host "--- Uploading Lambda Code ---" -ForegroundColor Cyan
aws s3 cp lambda.zip s3://platemate-frontend-app/lambda.zip --endpoint-url $ENDPOINT

Write-Host "--- Deploying CloudFormation Stack ---" -ForegroundColor Cyan
aws --no-cli-pager cloudformation deploy `
    --stack-name platemate-local-v2 `
    --template-file template.yaml `
    --capabilities CAPABILITY_NAMED_IAM `
    --endpoint-url $ENDPOINT


Write-Host ""
Write-Host "--- Deployment Complete ---" -ForegroundColor Green

# Fetch the API URL from outputs
$outputs = aws --no-cli-pager cloudformation describe-stacks --stack-name platemate-local-v2 --query "Stacks[0].Outputs" --output json --endpoint-url $ENDPOINT | ConvertFrom-Json

$apiUrl = ($outputs | Where-Object { $_.OutputKey -eq "ApiEndpoint" }).OutputValue

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

