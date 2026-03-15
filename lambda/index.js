const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Environment variables
const REVIEWS_TABLE = process.env.REVIEWS_TABLE || "platemate-reviews";
const USERS_TABLE = process.env.USERS_TABLE || "platemate-users";
const AVATAR_BUCKET = process.env.AVATAR_BUCKET || "platemate-assets";
const RESTAURANTS_TABLE = process.env.RESTAURANTS_TABLE || "platemate-restaurants";
const IS_LOCALSTACK = process.env.IS_LOCALSTACK === "true";
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

let ddbDocClient;
let s3Client;

// Test helper to inject mocks
if (process.env.NODE_ENV === 'test') {
    exports._test_setClients = (ddb, s3) => {
        ddbDocClient = ddb;
        s3Client = s3;
    };
}

exports.handler = async (event) => {
    console.log("--- HANDLER START ---");
    console.log("Event:", JSON.stringify({
        ...event,
        body: event.body ? (event.body.length > 500 ? event.body.substring(0, 500) + "..." : event.body) : null
    }));

    // Log environment variable status (without values)
    console.log("Environment Status:", {
        REVIEWS_TABLE,
        USERS_TABLE,
        AVATAR_BUCKET,
        RESTAURANTS_TABLE,
        AWS_REGION,
        IS_LOCALSTACK,
        HAS_GOOGLE_KEY: !!process.env.GOOGLE_API_KEY,
        USE_MOCK_DATA: process.env.USE_MOCK_DATA,
        NODE_ENV: process.env.NODE_ENV
    });

    // Initialize clients inside handler for better test isolation and lazy loading
    if (!ddbDocClient) {
        console.log("Initializing DynamoDB Client...");
        const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
        const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
        
        const clientConfig = { region: AWS_REGION };
        if (IS_LOCALSTACK) {
            console.log("LocalStack detected, setting endpoint...");
            const endpoint = process.env.LOCALSTACK_HOSTNAME 
                ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
                : "http://localstack:4566";
            clientConfig.endpoint = endpoint;
            clientConfig.forcePathStyle = true;
            clientConfig.credentials = { accessKeyId: "test", secretAccessKey: "test" };
        }
        
        const ddbClient = new DynamoDBClient(clientConfig);
        ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
    }

    if (!s3Client) {
        console.log("Initializing S3 Client...");
        const { S3Client } = require("@aws-sdk/client-s3");
        
        const clientConfig = { region: AWS_REGION };
        if (IS_LOCALSTACK) {
            const endpoint = process.env.LOCALSTACK_HOSTNAME 
                ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
                : "http://localstack:4566";
            clientConfig.endpoint = endpoint;
            clientConfig.forcePathStyle = true;
            clientConfig.credentials = { accessKeyId: "test", secretAccessKey: "test" };
        }
        
        s3Client = new S3Client(clientConfig);
    }

    // Explicitly import required commands for DynamoDB
    const { 
        ScanCommand, 
        PutCommand, 
        UpdateCommand, 
        DeleteCommand, 
        GetCommand 
    } = require("@aws-sdk/lib-dynamodb");
    const { PutObjectCommand } = require("@aws-sdk/client-s3");

    let { httpMethod, path = "/", pathParameters, body: bodyStr } = event;
    const body = bodyStr ? JSON.parse(bodyStr) : {};

    // Robust path normalization for LocalStack/APIGateway
    if (pathParameters && pathParameters.proxy) {
        path = '/' + pathParameters.proxy;
    } else {
        // Step-by-step normalization to handle stage prefixes and LocalStack markers
        let segments = path.split('/').filter(Boolean);
        
        // Repeatedly remove segments if they match stage or LocalStack patterns
        // This handles cases like /Prod/_user_request_/reviews
        while (segments.length > 0 && 
               (['Prod', 'dev', 'stage', '_user_request_'].includes(segments[0]))) {
            segments.shift();
        }
        
        path = '/' + segments.join('/');
    }

    if (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
    }

    console.log(`Normalized Path: ${path}, Method: ${httpMethod}`);

    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
        "Access-Control-Allow-Headers": "Content-Type,Authorization"
    };

    if (httpMethod === 'OPTIONS') {
        console.log("Handling OPTIONS request...");
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // --- REVIEWS ROUTES ---
        if (httpMethod === 'GET' && path === '/reviews') {
            console.log(`Fetching reviews from ${REVIEWS_TABLE}...`);
            const result = await ddbDocClient.send(new ScanCommand({ TableName: REVIEWS_TABLE }));
            console.log(`Found ${result.Items?.length || 0} reviews.`);
            return { statusCode: 200, headers, body: JSON.stringify(result.Items) };
        }

        else if (httpMethod === 'POST' && path === '/reviews') {
            const reviewId = body.id || `r_${Date.now()}`;
            console.log(`Creating review ${reviewId} in ${REVIEWS_TABLE}...`);
            await ddbDocClient.send(new PutCommand({
                TableName: REVIEWS_TABLE,
                Item: {
                    reviewId,
                    ...body
                }
            }));
            return { statusCode: 201, headers, body: JSON.stringify({ message: "Review created", reviewId }) };
        }

        else if (httpMethod === 'DELETE' && path.startsWith('/reviews/')) {
            const reviewId = path.split('/').pop();
            console.log(`Deleting review ${reviewId} from ${REVIEWS_TABLE}...`);
            await ddbDocClient.send(new DeleteCommand({
                TableName: REVIEWS_TABLE,
                Key: { reviewId }
            }));
            return { statusCode: 200, headers, body: JSON.stringify({ message: "Review deleted" }) };
        }

        else if (httpMethod === 'POST' && path.includes('/like')) {
            const reviewId = path.split('/')[2];
            console.log(`Toggling like for review ${reviewId}...`);
            const getRes = await ddbDocClient.send(new GetCommand({
                TableName: REVIEWS_TABLE,
                Key: { reviewId }
            }));

            if (!getRes.Item) {
                console.log(`Review ${reviewId} not found.`);
                return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };
            }

            const userId = body.userId;
            let likedBy = getRes.Item.likedBy || [];
            if (likedBy.includes(userId)) {
                console.log(`User ${userId} unliking review.`);
                likedBy = likedBy.filter(id => id !== userId);
            } else {
                console.log(`User ${userId} liking review.`);
                likedBy.push(userId);
            }

            await ddbDocClient.send(new UpdateCommand({
                TableName: REVIEWS_TABLE,
                Key: { reviewId },
                UpdateExpression: "SET likedBy = :lb, likes = :l",
                ExpressionAttributeValues: {
                    ":lb": likedBy,
                    ":l": likedBy.length
                }
            }));

            return { statusCode: 200, headers, body: JSON.stringify({ likedBy, likes: likedBy.length }) };
        }

        else if (httpMethod === 'POST' && path.includes('/comments')) {
            const reviewId = path.split('/')[2];
            const newComment = {
                id: `c_${Date.now()}`,
                author: body.author,
                text: body.text,
                time: "Just now",
                avatar: "https://i.pravatar.cc/150?img=32"
            };
            console.log(`Adding comment to review ${reviewId}:`, JSON.stringify(newComment));

            await ddbDocClient.send(new UpdateCommand({
                TableName: REVIEWS_TABLE,
                Key: { reviewId },
                UpdateExpression: "SET commentsList = list_append(if_not_exists(commentsList, :empty_list), :c), #cmt = if_not_exists(#cmt, :zero) + :inc",
                ExpressionAttributeNames: {
                    "#cmt": "comments"
                },
                ExpressionAttributeValues: {
                    ":c": [newComment],
                    ":empty_list": [],
                    ":inc": 1,
                    ":zero": 0
                }
            }));

            return { statusCode: 201, headers, body: JSON.stringify(newComment) };
        }

        else if (httpMethod === 'PUT' && path.startsWith('/reviews/')) {
            const reviewId = path.split('/').pop();
            console.log(`Updating review ${reviewId}...`);
            await ddbDocClient.send(new UpdateCommand({
                TableName: REVIEWS_TABLE,
                Key: { reviewId },
                UpdateExpression: "SET #txt = :t, dishes = :d",
                ExpressionAttributeNames: {
                    "#txt": "text"
                },
                ExpressionAttributeValues: {
                    ":t": body.text,
                    ":d": body.dishes
                }
            }));
            return { statusCode: 200, headers, body: JSON.stringify({ message: "Review updated" }) };
        }

        // --- USERS ROUTES ---
        else if (httpMethod === 'GET' && path.startsWith('/users/') && !path.includes('/avatar') && !path.includes('/meal-photo')) {
            const userId = path.split('/').pop();
            console.log(`Fetching user ${userId} from ${USERS_TABLE}...`);
            const result = await ddbDocClient.send(new GetCommand({
                TableName: USERS_TABLE,
                Key: { userId }
            }));
            console.log(`User found: ${!!result.Item}`);
            return { statusCode: 200, headers, body: JSON.stringify(result.Item || {}) };
        }

        else if (httpMethod === 'PUT' && path.startsWith('/users/') && !path.includes('/avatar') && !path.includes('/meal-photo')) {
            const userId = path.split('/').pop();
            console.log(`Updating user ${userId} in ${USERS_TABLE}...`);

            const updateKeys = Object.keys(body);
            if (updateKeys.length === 0) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "No update fields provided" }) };
            }

            const UpdateExpression = "SET " + updateKeys.map((k, i) => `#field${i} = :val${i}`).join(", ");
            const ExpressionAttributeNames = updateKeys.reduce((acc, k, i) => ({ ...acc, [`#field${i}`]: k }), {});
            const ExpressionAttributeValues = updateKeys.reduce((acc, k, i) => ({ ...acc, [`:val${i}`]: body[k] }), {});

            await ddbDocClient.send(new UpdateCommand({
                TableName: USERS_TABLE,
                Key: { userId },
                UpdateExpression,
                ExpressionAttributeNames,
                ExpressionAttributeValues
            }));
            return { statusCode: 200, headers, body: JSON.stringify({ message: "Profile updated" }) };
        }

        else if (httpMethod === 'DELETE' && path.startsWith('/users/') && !path.includes('/avatar') && !path.includes('/meal-photo')) {
            const userId = path.split('/').pop();
            console.log(`Deleting user ${userId} from ${USERS_TABLE}...`);
            await ddbDocClient.send(new DeleteCommand({
                TableName: USERS_TABLE,
                Key: { userId }
            }));
            return { statusCode: 200, headers, body: JSON.stringify({ message: "Account deleted" }) };
        }

        // Helper for S3 presigned URLs
        else if (httpMethod === 'POST' && (path.includes('/avatar') || path.includes('/meal-photo') || path.includes('/photo-url'))) {
            let key;
            if (path.includes('/avatar')) {
                const userId = path.split('/')[2];
                key = `avatars/${userId}/${Date.now()}_${body.fileName || "avatar.jpg"}`;
            } else if (path.includes('/meal-photo')) {
                const userId = path.split('/')[2];
                key = `meals/${userId}/${Date.now()}_${body.fileName || "meal.jpg"}`;
            } else { // /photo-url for restaurants
                const placeId = path.split('/')[2];
                key = `meals/headers/${placeId}/${Date.now()}_${body.fileName || "header.jpg"}`;
            }

            console.log(`Generating presigned URL for key: ${key} in bucket: ${AVATAR_BUCKET}`);

            const command = new PutObjectCommand({
                Bucket: AVATAR_BUCKET,
                Key: key,
                ContentType: body.contentType || 'image/jpeg'
            });

            let uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
            let publicUrl;

            if (IS_LOCALSTACK) {
                // Adjust LocalStack URL for browser access
                uploadUrl = uploadUrl.replace(/https?:\/\/(?:[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|localstack):4566/, 'http://localhost:4566');
                publicUrl = `http://localhost:4566/${AVATAR_BUCKET}/${key}`;
            } else if (process.env.CLOUDFRONT_DOMAIN) {
                publicUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`;
            } else {
                publicUrl = `https://${AVATAR_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
            }

            console.log(`Generated publicUrl: ${publicUrl}`);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ uploadUrl, publicUrl, key })
            };
        }

        // --- RESTAURANTS ROUTES ---
        else if (httpMethod === 'PUT' && path.startsWith('/restaurants/')) {
            const placeId = path.split('/').pop();
            console.log(`Updating cached restaurant ${placeId} in ${RESTAURANTS_TABLE}...`);
            const getRes = await ddbDocClient.send(new GetCommand({
                TableName: RESTAURANTS_TABLE,
                Key: { placeId }
            }));

            if (!getRes.Item) {
                console.log(`Restaurant ${placeId} not found in cache.`);
                return { statusCode: 404, headers, body: JSON.stringify({ error: "Restaurant not found in cache. Fetch it first." }) };
            }

            const updateKeys = Object.keys(body);
            if (updateKeys.length === 0) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "No update fields provided" }) };
            }

            const UpdateExpression = "SET " + updateKeys.map((k, i) => `#field${i} = :val${i}`).join(", ");
            const ExpressionAttributeNames = updateKeys.reduce((acc, k, i) => ({ ...acc, [`#field${i}`]: k }), {});
            const ExpressionAttributeValues = updateKeys.reduce((acc, k, i) => ({ ...acc, [`:val${i}`]: body[k] }), {});

            await ddbDocClient.send(new UpdateCommand({
                TableName: RESTAURANTS_TABLE,
                Key: { placeId },
                UpdateExpression,
                ExpressionAttributeNames,
                ExpressionAttributeValues
            }));

            console.log(`Successfully updated restaurant ${placeId}.`);
            return { statusCode: 200, headers, body: JSON.stringify({ message: "Restaurant updated" }) };
        }

        else if (httpMethod === 'GET' && path === '/restaurants/search') {
            const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
            let query = event.queryStringParameters?.q;
            const location = event.queryStringParameters?.location;

            console.log(`RESTAURANT SEARCH: query="${query}", location="${location}"`);

            if (!query) {
                console.log("Error: Search query missing.");
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Query required" }) };
            }
            
            const mockResults = [
                { place_id: "mock_1", name: "The Pizza Palace", formatted_address: "123 Cheese St, San Francisco, CA", rating: 4.5, price_level: 2, opening_hours: { open_now: true } },
                { place_id: "mock_2", name: "Burger Haven", formatted_address: "456 Patty Ln, San Francisco, CA", rating: 4.2, price_level: 1, opening_hours: { open_now: false } },
                { place_id: "mock_3", name: "Sushi Zen", formatted_address: "789 Maki Rd, San Francisco, CA", rating: 4.8, price_level: 3, opening_hours: { open_now: true } }
            ];

            // If no API key, return mock data immediately
            if (!GOOGLE_API_KEY || GOOGLE_API_KEY.trim() === "") {
                console.log("SEARCH: GOOGLE_API_KEY is missing or empty.");
                if (process.env.USE_MOCK_DATA === "true") {
                    console.log("SEARCH: USE_MOCK_DATA is true, returning mock results.");
                    return { statusCode: 200, headers, body: JSON.stringify(mockResults) };
                }
                console.log("SEARCH: USE_MOCK_DATA is false, returning 401.");
                return { statusCode: 401, headers, body: JSON.stringify({ error: "Google API Key missing" }) };
            }

            if (location) {
                // Check if location is a coordinate pair (lat,lng)
                // e.g., "37.77,-122.42" or "37.7749, -122.4194"
                const coordinateRegex = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
                
                if (coordinateRegex.test(location.trim())) {
                    // It's a coordinate pair. Use location and radius (e.g., 50km)
                    const cleanCoords = location.replace(/\s/g, '');
                    googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${cleanCoords}&radius=50000&key=${GOOGLE_API_KEY}`;
                } else {
                    // Standard location name or zip code
                    query = `${query} in ${location}`;
                    googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
                }
            } else {
               googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
            }
            
            console.log(`SEARCH: Calling Google API: ${googleUrl.replace(GOOGLE_API_KEY, "HIDDEN")}`);
            
            try {
                const response = await fetch(googleUrl);
                const data = await response.json();
                console.log(`SEARCH: Google response status: ${data.status}`);
                
                if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
                    console.log(`SEARCH: Found ${data.results?.length || 0} results.`);
                    return { statusCode: 200, headers, body: JSON.stringify(data.results || []) };
                }
                
                // If Google returned an error status (like REQUEST_DENIED), fallback to mock if enabled
                console.log(`SEARCH: Google returned non-OK status: ${data.status}`);
                if (data.error_message) console.log(`SEARCH: Google Error Message: ${data.error_message}`);

                if (process.env.USE_MOCK_DATA === "true") {
                    console.log(`SEARCH: USE_MOCK_DATA is true, falling back to MOCK data.`);
                    return { statusCode: 200, headers, body: JSON.stringify(mockResults) };
                }
                return { statusCode: 502, headers, body: JSON.stringify({ error: `Google API error: ${data.status}`, details: data.error_message }) };

            } catch (err) {
                console.error("SEARCH: Google API fetch failed with exception:", err);
                if (process.env.USE_MOCK_DATA === "true") {
                    console.log(`SEARCH: USE_MOCK_DATA is true, falling back to MOCK data after exception.`);
                    return { statusCode: 200, headers, body: JSON.stringify(mockResults) };
                }
                return { statusCode: 502, headers, body: JSON.stringify({ error: "Failed to reach Google API", details: err.message }) };
            }
        }

        else if (httpMethod === 'GET' && path.includes('/photo/')) {
            const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
            const photoRef = path.split('/').pop();
            console.log(`PHOTO: Fetching photo with ref: ${photoRef.substring(0, 20)}...`);
            
            const googleUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${GOOGLE_API_KEY}`;
            const response = await fetch(googleUrl);

            if (!response.ok) {
                console.log(`PHOTO: Google returned ${response.status} ${response.statusText}`);
                return { statusCode: response.status, headers, body: JSON.stringify({ error: "Failed to fetch photo" }) };
            }

            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            console.log(`PHOTO: Successfully fetched and encoded photo (${buffer.byteLength} bytes).`);

            return {
                statusCode: 200,
                headers: {
                    ...headers,
                    "Content-Type": response.headers.get("content-type") || "image/jpeg"
                },
                body: base64,
                isBase64Encoded: true
            };
        }

        else if (httpMethod === 'GET' && path.startsWith('/restaurants/')) {
            const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
            const placeId = path.split('/').pop();
            console.log(`RESTAURANT DETAILS: placeId=${placeId}`);

            try {
                console.log(`Checking cache in ${RESTAURANTS_TABLE} for ${placeId}...`);
                const cacheRes = await ddbDocClient.send(new GetCommand({
                    TableName: RESTAURANTS_TABLE,
                    Key: { placeId }
                }));

                if (cacheRes.Item) {
                    console.log(`Cache HIT for ${placeId}.`);
                    return { statusCode: 200, headers, body: JSON.stringify(cacheRes.Item) };
                }
                console.log(`Cache MISS for ${placeId}.`);
            } catch (err) {
                console.error("Cache Read Error (non-fatal):", err);
            }

            let data = { result: null, status: 'UNKNOWN' };
            if (GOOGLE_API_KEY) {
                const googleUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`;
                console.log(`Calling Google API for details: ${googleUrl.replace(GOOGLE_API_KEY, "HIDDEN")}`);
                try {
                    const response = await fetch(googleUrl);
                    data = await response.json();
                    console.log(`Google Details status: ${data.status}`);
                } catch (err) {
                    console.error("Google Fetch Error:", err);
                }
            } else {
                console.log("No GOOGLE_API_KEY, skipping Google call.");
            }

            let result = data.result || null;

            if (!result && process.env.USE_MOCK_DATA === "true") {
                console.log(`No results from Google, returning MOCK details for ${placeId}.`);
                const mockDetails = {
                    mock_1: { name: "The Pizza Palace", formatted_address: "123 Cheese St, San Francisco, CA", rating: 4.5, price_level: 2, formatted_phone_number: "(555) 123-4567", website: "https://pizzapalace.example.com", opening_hours: { weekday_text: ["Monday: 11:00 AM – 10:00 PM"] } },
                    mock_2: { name: "Burger Haven", formatted_address: "456 Pattie Ln, San Francisco, CA", rating: 4.2, price_level: 1, formatted_phone_number: "(555) 987-6543" },
                    mock_3: { name: "Sushi Zen", formatted_address: "789 Maki Rd, San Francisco, CA", rating: 4.8, price_level: 3 }
                };
                result = mockDetails[placeId] || { name: "Unknown Mock Restaurant", place_id: placeId };
            }

            if (result && result.name) {
                try {
                    console.log(`Caching restaurant details for ${placeId}...`);
                    await ddbDocClient.send(new PutCommand({
                        TableName: RESTAURANTS_TABLE,
                        Item: {
                            placeId,
                            ...result,
                            cachedAt: new Date().toISOString()
                        }
                    }));
                } catch (err) {
                    console.error("Cache Write Error (non-fatal):", err);
                }
            }

            return { statusCode: 200, headers, body: JSON.stringify(result || {}) };
        }

        console.log(`Route not found: ${httpMethod} ${path}`);
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "Route not found", path, method: httpMethod })
        };

    } catch (error) {
        console.error("HANDLER CRITICAL ERROR:", error);
        console.error("Stack Trace:", error.stack);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: error.message,
                stack: error.stack,
                details: "Check CloudWatch logs for more info"
            })
        };
    } finally {
        console.log("--- HANDLER END ---");
    }
};
