const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    ScanCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand,
    GetCommand
} = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const s3Client = new S3Client({});

const REVIEWS_TABLE = process.env.REVIEWS_TABLE || "platemate-reviews";
const USERS_TABLE = process.env.USERS_TABLE || "platemate-users";
const AVATAR_BUCKET = process.env.AVATAR_BUCKET || "platemate-frontend-app";
const RESTAURANTS_TABLE = process.env.RESTAURANTS_TABLE || "platemate-restaurants";

exports.handler = async (event) => {
    console.log("Event:", JSON.stringify(event));

    let { httpMethod, path, pathParameters, body: bodyStr } = event;
    const body = bodyStr ? JSON.parse(bodyStr) : {};

    // Robust path normalization for LocalStack/APIGateway
    // 1. Try to use pathParameters.proxy if available (most reliable for /{proxy+})
    if (pathParameters && pathParameters.proxy) {
        path = '/' + pathParameters.proxy;
    } else {
        // 2. Fallback: Strip common prefixes like stage name or /_user_request_
        // This handles cases like /dev/reviews or /_user_request_/reviews (case-insensitive)
        path = path.replace(/^\/(?:dev|prod|stage)\//i, '/');
        path = path.replace(/^\/_user_request_\//i, '/');
        // Handle cases where it might be /dev/_user_request_/reviews
        path = path.replace(/^\/(?:dev|prod|stage)\/_user_request_\//i, '/');
    }

    // 3. Remove trailing slashes and normalize
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
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // --- REVIEWS ROUTES ---

        // GET /reviews
        if (httpMethod === 'GET' && path === '/reviews') {
            const result = await ddbDocClient.send(new ScanCommand({ TableName: REVIEWS_TABLE }));
            return { statusCode: 200, headers, body: JSON.stringify(result.Items) };
        }

        // POST /reviews
        else if (httpMethod === 'POST' && path === '/reviews') {
            await ddbDocClient.send(new PutCommand({
                TableName: REVIEWS_TABLE,
                Item: {
                    reviewId: body.id || `r_${Date.now()}`,
                    ...body
                }
            }));
            return { statusCode: 201, headers, body: JSON.stringify({ message: "Review created" }) };
        }

        // DELETE /reviews/{id}
        else if (httpMethod === 'DELETE' && path.startsWith('/reviews/')) {
            const reviewId = path.split('/').pop();
            await ddbDocClient.send(new DeleteCommand({
                TableName: REVIEWS_TABLE,
                Key: { reviewId }
            }));
            return { statusCode: 200, headers, body: JSON.stringify({ message: "Review deleted" }) };
        }

        // POST /reviews/{id}/like
        else if (httpMethod === 'POST' && path.includes('/like')) {
            const reviewId = path.split('/')[2];
            const getRes = await ddbDocClient.send(new GetCommand({
                TableName: REVIEWS_TABLE,
                Key: { reviewId }
            }));

            if (!getRes.Item) return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };

            const userId = body.userId;
            let likedBy = getRes.Item.likedBy || [];
            if (likedBy.includes(userId)) {
                likedBy = likedBy.filter(id => id !== userId);
            } else {
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

        // POST /reviews/{id}/comments
        else if (httpMethod === 'POST' && path.includes('/comments')) {
            const reviewId = path.split('/')[2];
            const newComment = {
                id: `c_${Date.now()}`,
                author: body.author,
                text: body.text,
                time: "Just now",
                avatar: "https://i.pravatar.cc/150?img=32"
            };

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

        // PUT /reviews/{id} (Update)
        else if (httpMethod === 'PUT' && path.startsWith('/reviews/')) {
            const reviewId = path.split('/').pop();
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

        // DELETE /reviews/{id}
        else if (httpMethod === 'DELETE' && path.startsWith('/reviews/')) {
            const reviewId = path.split('/').pop();
            await ddbDocClient.send(new DeleteCommand({
                TableName: REVIEWS_TABLE,
                Key: { reviewId }
            }));
            return { statusCode: 204, headers, body: "" };
        }

        // --- USERS ROUTES ---

        // GET /users/{id}
        else if (httpMethod === 'GET' && path.startsWith('/users/')) {
            const userId = path.split('/').pop();
            const result = await ddbDocClient.send(new GetCommand({
                TableName: USERS_TABLE,
                Key: { userId }
            }));
            return { statusCode: 200, headers, body: JSON.stringify(result.Item || {}) };
        }

        // PUT /users/{id}
        else if (httpMethod === 'PUT' && path.startsWith('/users/')) {
            const userId = path.split('/').pop();
            await ddbDocClient.send(new PutCommand({
                TableName: USERS_TABLE,
                Item: { userId, ...body }
            }));
            return { statusCode: 200, headers, body: JSON.stringify({ message: "Profile updated" }) };
        }

        // DELETE /users/{id}
        else if (httpMethod === 'DELETE' && path.startsWith('/users/')) {
            const userId = path.split('/').pop();
            await ddbDocClient.send(new DeleteCommand({
                TableName: USERS_TABLE,
                Key: { userId }
            }));
            return { statusCode: 200, headers, body: JSON.stringify({ message: "Account deleted" }) };
        }

        // POST /users/{id}/avatar (Presigned URL)
        else if (httpMethod === 'POST' && path.includes('/avatar')) {
            const userId = path.split('/')[2];
            const fileName = body.fileName || "avatar.jpg";
            const key = `avatars/${userId}/${Date.now()}_${fileName}`;

            const command = new PutObjectCommand({
                Bucket: AVATAR_BUCKET,
                Key: key,
                ContentType: body.contentType || 'image/jpeg'
            });

            let uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
            // Fix LocalStack internal IP issue for host access
            uploadUrl = uploadUrl.replace(/https?:\/\/(?:[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|localstack):4566/, 'http://localhost:4566');

            const publicUrl = `http://localhost:4566/${AVATAR_BUCKET}/${key}`;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ uploadUrl, publicUrl, key })
            };
        }

        // POST /users/{id}/meal-photo (Presigned URL for Dish Photos)
        else if (httpMethod === 'POST' && path.includes('/meal-photo')) {
            const userId = path.split('/')[2];
            const fileName = body.fileName || "meal.jpg";
            const key = `meals/${userId}/${Date.now()}_${fileName}`;

            const command = new PutObjectCommand({
                Bucket: AVATAR_BUCKET, // Reuse the same frontend bucket
                Key: key,
                ContentType: body.contentType || 'image/jpeg'
            });

            let uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
            // Fix LocalStack internal IP issue for host access
            uploadUrl = uploadUrl.replace(/https?:\/\/(?:[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|localstack):4566/, 'http://localhost:4566');

            const publicUrl = `http://localhost:4566/${AVATAR_BUCKET}/${key}`;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ uploadUrl, publicUrl, key })
            };
        }

        // --- RESTAURANTS ROUTES ---

        // PUT /restaurants/{id} (Update Cached Restaurant Attributes)
        else if (httpMethod === 'PUT' && path.startsWith('/restaurants/')) {
            const RESTAURANTS_TABLE = process.env.RESTAURANTS_TABLE || "platemate-restaurants";
            const placeId = path.split('/').pop();

            // First get the existing record, or it will fail if it's not cached yet
            const getRes = await ddbDocClient.send(new GetCommand({
                TableName: RESTAURANTS_TABLE,
                Key: { placeId }
            }));

            // If not cached, we can't update it yet. The frontend should fetch it first.
            if (!getRes.Item) {
                return { statusCode: 404, headers, body: JSON.stringify({ error: "Restaurant not found in cache. Fetch it first." }) };
            }

            // Create update expression dynamically based on body keys
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

            return { statusCode: 200, headers, body: JSON.stringify({ message: "Restaurant updated" }) };
        }

        // POST /restaurants/{id}/photo-url (Presigned URL for Header Photos)
        else if (httpMethod === 'POST' && path.includes('/photo-url')) {
            const placeId = path.split('/')[2];
            const fileName = body.fileName || "header.jpg";
            const key = `meals/headers/${placeId}/${Date.now()}_${fileName}`;

            const command = new PutObjectCommand({
                Bucket: AVATAR_BUCKET,
                Key: key,
                ContentType: body.contentType || 'image/jpeg'
            });

            let uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
            // Fix LocalStack internal IP issue for host access
            uploadUrl = uploadUrl.replace(/https?:\/\/(?:[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|localstack):4566/, 'http://localhost:4566');

            const publicUrl = `http://localhost:4566/${AVATAR_BUCKET}/${key}`;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ uploadUrl, publicUrl, key })
            };
        }

        // GET /restaurants/search?q=...&location=...
        else if (httpMethod === 'GET' && path === '/restaurants/search') {
            const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
            console.log(`Using Google API Key starting with: ${GOOGLE_API_KEY ? GOOGLE_API_KEY.substring(0, 4) : 'MISSING'}`);

            let query = event.queryStringParameters?.q;
            const location = event.queryStringParameters?.location;

            if (!query) return { statusCode: 400, headers, body: JSON.stringify({ error: "Query required" }) };

            if (location) {
                query = `${query} in ${location}`;
            }

            const googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
            console.log(`Fetching from Google: ${googleUrl}`);

            let data = { status: 'UNKNOWN', results: [] };
            try {
                const response = await fetch(googleUrl);
                data = await response.json();
            } catch (err) {
                console.error("Fetch to Google failed:", err);
            }

            console.log(`Google API Response Data: ${JSON.stringify(data)}`);
            console.log(`Google API Status: ${data.status}, Results count: ${data.results ? data.results.length : 0}`);

            const results = data.results || [];

            // Mock Data Fallback for testing when API key is invalid/missing
            if ((results.length === 0 || data.status !== 'OK') && process.env.USE_MOCK_DATA === "true") {
                console.log("Using Mock Data Fallback for search results");
                const mockResults = [
                    {
                        place_id: "mock_1",
                        name: "The Pizza Palace",
                        formatted_address: "123 Cheese St, San Francisco, CA",
                        rating: 4.5,
                        price_level: 2,
                        opening_hours: { open_now: true }
                    },
                    {
                        place_id: "mock_2",
                        name: "Burger Haven",
                        formatted_address: "456 Patty Ln, San Francisco, CA",
                        rating: 4.2,
                        price_level: 1,
                        opening_hours: { open_now: false }
                    },
                    {
                        place_id: "mock_3",
                        name: "Sushi Zen",
                        formatted_address: "789 Maki Rd, San Francisco, CA",
                        rating: 4.8,
                        price_level: 3,
                        opening_hours: { open_now: true }
                    }
                ];
                console.log(`Returning ${mockResults.length} MOCK results to client`);
                return { statusCode: 200, headers, body: JSON.stringify(mockResults) };
            }

            console.log(`Returning ${results.length} results to client`);
            return { statusCode: 200, headers, body: JSON.stringify(results) };
        }

        // GET /restaurants/photo/{photoRef}
        else if (httpMethod === 'GET' && path.includes('/photo/')) {
            const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
            const photoRef = path.split('/').pop();
            const response = await fetch(`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${GOOGLE_API_KEY}`);

            if (!response.ok) {
                return { statusCode: response.status, headers, body: JSON.stringify({ error: "Failed to fetch photo" }) };
            }

            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');

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

        // GET /restaurants/{placeId}
        else if (httpMethod === 'GET' && path.startsWith('/restaurants/')) {
            const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
            const RESTAURANTS_TABLE = process.env.RESTAURANTS_TABLE || "platemate-restaurants";
            const placeId = path.split('/').pop();

            console.log(`Checking cache for placeId: ${placeId}`);

            // 1. Try Cache
            try {
                const cacheRes = await ddbDocClient.send(new GetCommand({
                    TableName: RESTAURANTS_TABLE,
                    Key: { placeId }
                }));

                if (cacheRes.Item) {
                    console.log(`Cache Hit for ${placeId}`);
                    return { statusCode: 200, headers, body: JSON.stringify(cacheRes.Item) };
                }
            } catch (err) {
                console.error("Cache Read Error:", err);
            }

            console.log(`Cache Miss for ${placeId}, fetching from Google...`);

            // 2. Fetch from Google if cache miss or error
            let data = { result: null, status: 'UNKNOWN' };
            try {
                const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`);
                data = await response.json();
            } catch (err) {
                console.error("Google Fetch Error:", err);
            }

            let result = data.result || null;

            // Mock Data Fallback for Details
            if (!result && process.env.USE_MOCK_DATA === "true") {
                console.log(`Using Mock Data Fallback for details of ${placeId}`);
                const mockDetails = {
                    mock_1: {
                        name: "The Pizza Palace",
                        formatted_address: "123 Cheese St, San Francisco, CA",
                        rating: 4.5,
                        price_level: 2,
                        formatted_phone_number: "(555) 123-4567",
                        website: "https://pizzapalace.example.com",
                        opening_hours: { weekday_text: ["Monday: 11:00 AM – 10:00 PM"] }
                    },
                    mock_2: {
                        name: "Burger Haven",
                        formatted_address: "456 Pattie Ln, San Francisco, CA",
                        rating: 4.2,
                        price_level: 1,
                        formatted_phone_number: "(555) 987-6543"
                    },
                    mock_3: {
                        name: "Sushi Zen",
                        formatted_address: "789 Maki Rd, San Francisco, CA",
                        rating: 4.8,
                        price_level: 3
                    }
                };
                result = mockDetails[placeId] || { name: "Unknown Mock Restaurant", place_id: placeId };
            }

            // 3. Save to Cache if we have a valid result
            if (result && result.name) {
                try {
                    console.log(`Saving ${placeId} to cache...`);
                    await ddbDocClient.send(new PutCommand({
                        TableName: RESTAURANTS_TABLE,
                        Item: {
                            placeId,
                            ...result,
                            cachedAt: new Date().toISOString()
                        }
                    }));
                } catch (err) {
                    console.error("Cache Write Error:", err);
                }
            }

            return { statusCode: 200, headers, body: JSON.stringify(result || {}) };
        }

        console.log(`No route matched for Path: ${path}, Method: ${httpMethod}`);
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "Route not found", path, method: httpMethod })
        };

    } catch (error) {
        console.error("Handler Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
