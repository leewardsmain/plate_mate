import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize mocks
const ddbMock = mockClient(DynamoDBDocumentClient);
const s3Mock = mockClient(S3Client);

// Mock s3-request-presigner
vi.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: vi.fn().mockResolvedValue('http://mock-signed-url')
}));

// Require the handler AFTER mocks
const lambda = require('../../lambda/index');
const { handler, _test_setClients } = lambda;

describe('Lambda Backend Unit Tests', () => {
    beforeEach(() => {
        ddbMock.reset();
        s3Mock.reset();
        vi.clearAllMocks();

        // Inject mocks with dummy credentials to satisfy getSignedUrl requirements
        if (_test_setClients) {
            const s3WithCreds = new S3Client({
                region: 'us-east-1',
                credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
            });
            // We still want to use the mock client for assertions, but need the creds
            // Actually, s3Mock IS an S3Client instance from aws-sdk-client-mock
            // but let's see if we can just inject a real one with creds that we then mock
            _test_setClients(ddbMock, s3WithCreds);
            // Re-bind s3Mock to the one we just injected if needed, 
            // but actually mock-aws-sdk usually works by constructor interception
        }
    });

    it('GET /reviews should return all reviews', async () => {
        const mockItems = [{ reviewId: 'r1', text: 'Good' }];
        ddbMock.on(ScanCommand).resolves({ Items: mockItems });

        const event = {
            httpMethod: 'GET',
            path: '/reviews'
        };

        const result = await handler(event);
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual(mockItems);
    });

    it('POST /reviews should create a new review', async () => {
        ddbMock.on(PutCommand).resolves({});

        const event = {
            httpMethod: 'POST',
            path: '/reviews',
            body: JSON.stringify({ id: 'r2', text: 'New Review', userId: 'u1' })
        };

        const result = await handler(event);
        expect(result.statusCode).toBe(201);
        expect(JSON.parse(result.body).message).toBe('Review created');
    });

    it('GET /users/{id} should return user profile', async () => {
        const mockUser = { userId: 'u1', name: 'Test User' };
        ddbMock.on(GetCommand).resolves({ Item: mockUser });

        const event = {
            httpMethod: 'GET',
            path: '/users/u1'
        };

        const result = await handler(event);
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual(mockUser);
    });

    it('POST /users/{id}/avatar should return a presigned URL', async () => {
        const event = {
            httpMethod: 'POST',
            path: '/users/u1/avatar',
            body: JSON.stringify({ fileName: 'avatar.jpg', contentType: 'image/jpeg' })
        };

        const result = await handler(event);
        if (result.statusCode === 500) console.log('DEBUG 500 ERROR:', result.body);
        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.uploadUrl).toBeDefined();
        expect(body.publicUrl).toContain('avatars/u1/');
    });

    it('PUT /restaurants/{id} should update cached restaurant', async () => {
        // Mock GET first to simulate cache hit
        ddbMock.on(GetCommand).resolves({ Item: { placeId: 'rest1', name: 'Original' } });
        // Mock Update
        ddbMock.on(UpdateCommand).resolves({});

        const event = {
            httpMethod: 'PUT',
            path: '/restaurants/rest1',
            body: JSON.stringify({ ratingInfo: { "1": 5 } })
        };

        const result = await handler(event);
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).message).toBe('Restaurant updated');
    });

    it('returns 404 for unknown routes', async () => {
        const event = {
            httpMethod: 'GET',
            path: '/unknown'
        };

        const result = await handler(event);
        expect(result.statusCode).toBe(404);
    });
});
