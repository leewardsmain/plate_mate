const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4566/restapis/custom/dev/_user_request_';

export interface ApiReview {
    id: string;
    author: string;
    avatar: string;
    restaurantId: string;
    restaurantName: string;
    location: string;
    time: string;
    text: string;
    likes: number;
    comments: number;
    likedBy: string[];
    commentsList: any[];
    dishes: any[];
}

export interface ApiUser {
    userId: string;
    name: string;
    handle: string;
    avatar: string;
    bio?: string;
    location?: string;
    favCuisine?: string;
    reviewCount?: number;
    socialLinks?: {
        instagram?: string;
        twitter?: string;
    };
}

const apiRequest = async (path: string, options: RequestInit = {}) => {
    const url = `${BASE_URL}${path}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) return null;
    return response.json();
};

export const api = {
    // Reviews
    getReviews: (): Promise<ApiReview[]> => apiRequest('/reviews'),

    createReview: (review: Partial<ApiReview>): Promise<{ message: string }> =>
        apiRequest('/reviews', {
            method: 'POST',
            body: JSON.stringify(review)
        }),

    deleteReview: (id: string): Promise<{ message: string }> =>
        apiRequest(`/reviews/${id}`, { method: 'DELETE' }),

    toggleLike: (reviewId: string, userId: string): Promise<{ likedBy: string[], likes: number }> =>
        apiRequest(`/reviews/${reviewId}/like`, {
            method: 'POST',
            body: JSON.stringify({ userId })
        }),

    addComment: (reviewId: string, author: string, text: string): Promise<any> =>
        apiRequest(`/reviews/${reviewId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ author, text })
        }),

    // Users
    getUser: (userId: string): Promise<ApiUser> => apiRequest(`/users/${userId}`),

    updateUser: (userId: string, updates: Partial<ApiUser>): Promise<{ message: string }> =>
        apiRequest(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        }),

    deleteUser: (userId: string): Promise<{ message: string }> =>
        apiRequest(`/users/${userId}`, { method: 'DELETE' }),

    // Media
    getAvatarUploadUrl: (userId: string, fileName: string, contentType: string): Promise<{ uploadUrl: string, publicUrl: string, key: string }> =>
        apiRequest(`/users/${userId}/avatar`, {
            method: 'POST',
            body: JSON.stringify({ fileName, contentType })
        }),

    getMealPhotoUploadUrl: (userId: string, fileName: string, contentType: string): Promise<{ uploadUrl: string, publicUrl: string, key: string }> =>
        apiRequest(`/users/${userId}/meal-photo`, {
            method: 'POST',
            body: JSON.stringify({ fileName, contentType })
        }),

    uploadToS3: async (uploadUrl: string, file: File | Blob): Promise<void> => {
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
        if (!response.ok) throw new Error('S3 upload failed');
    },

    // Google Restaurants Proxy
    searchRestaurants: (query: string, location?: string): Promise<any[]> => {
        const queryParams = new URLSearchParams({ q: query });
        if (location) queryParams.append('location', location);
        return apiRequest(`/restaurants/search?${queryParams.toString()}`);
    },
    getRestaurantDetails: (placeId: string): Promise<any> => apiRequest(`/restaurants/${placeId}`),

    updateRestaurantDetails: (placeId: string, updates: any): Promise<any> =>
        apiRequest(`/restaurants/${placeId}`, { method: 'PUT', body: JSON.stringify(updates) }),

    getRestaurantHeaderUploadUrl: (placeId: string, fileName: string, contentType: string): Promise<{ uploadUrl: string, publicUrl: string, key: string }> =>
        apiRequest(`/restaurants/${placeId}/photo-url`, { method: 'POST', body: JSON.stringify({ fileName, contentType }) }),

    getRestaurantPhotoUrl: (photoRef: string): string => `${BASE_URL}/restaurants/photo/${photoRef}`
};
