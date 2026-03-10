import { create } from 'zustand';
import { api } from '../services/api';
import type { Toast, ToastType } from '../components/ui/Toast';
import { fetchAuthSession, signOut as amplifySignOut } from 'aws-amplify/auth';

export type Sentiment = 'love' | 'leave' | 'none';

export interface DishReview {
    id: string;
    name: string;
    price?: string;
    rating?: number;
    sentiment: Sentiment;
    img: string;
}

export interface Comment {
    id: string;
    author: string;
    avatar: string;
    text: string;
    time: string;
}

export interface DiningEvent {
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
    dishes: DishReview[];
    likedBy: string[];
    commentsList: Comment[];
}

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    handle: string;
    avatar: string;
    reviewCount: number;
    followerCount: string;
    bio?: string;
    location?: string;
    favCuisine?: string;
    savedRestaurants?: string[];
    foodTags?: string[];
    socialLinks?: {
        instagram?: string;
        twitter?: string;
        tiktok?: string;
        youtube?: string;
        website?: string;
    };
}

interface AppState {
    // UI State
    isCreateReviewModalOpen: boolean;
    initialReviewRestaurantId: string | null;
    openCreateReviewModal: (restaurantId?: string) => void;
    closeCreateReviewModal: () => void;

    // Header Upload
    uploadRestaurantHeader: (placeId: string, file: File) => Promise<void>;

    theme: 'dark' | 'light';
    toggleTheme: () => void;
    accentColor: string;
    setAccentColor: (color: string) => void;

    // Edit Modal State
    activeEditReviewId: string | null;
    activeEditDishId: string | null;
    openEditModal: (eventId: string, dishId?: string) => void;
    closeEditModal: () => void;

    // Data State
    currentUser: UserProfile;
    feedReviews: DiningEvent[];
    initApp: () => Promise<void>;
    addReview: (review: Omit<DiningEvent, 'id' | 'author' | 'avatar' | 'likes' | 'comments' | 'likedBy' | 'commentsList'>) => Promise<void>;
    updateReview: (eventId: string, updatedData: Partial<DiningEvent>) => Promise<void>;
    deleteReview: (eventId: string) => Promise<void>;
    toggleLike: (eventId: string) => Promise<void>;
    addComment: (eventId: string, text: string) => Promise<void>;
    isAuthenticated: boolean;
    setAuthStatus: (status: boolean) => void;
    signOut: () => Promise<void>;
    updateCurrentUser: (updates: Partial<UserProfile>) => Promise<void>;
    updateUserAvatar: (fileOrUrl: File | string | null) => Promise<void>;

    // Restaurant Search & Details
    searchResults: any[];
    currentRestaurant: any | null;
    restaurantDetailsCache: Record<string, any>;
    searchRestaurants: (query: string, location?: string) => Promise<void>;
    fetchRestaurantDetails: (placeId: string) => Promise<void>;
    fetchSavedRestaurantDetails: (placeIds: string[]) => Promise<void>;
    toggleSavedRestaurant: (placeId: string) => Promise<void>;

    // Toast Notifications
    toasts: Toast[];
    addToast: (message: string, type: ToastType) => void;
    removeToast: (id: string) => void;
}

const INITIAL_REVIEWS: DiningEvent[] = [
    {
        id: 'r1',
        author: 'John Doe',
        avatar: 'https://i.pravatar.cc/150?img=11',
        restaurantId: 'nobu',
        restaurantName: 'Nobu Downtown',
        location: 'New York, NY',
        time: '2h ago',
        text: '"Absolutely incredible omakase experience. The Black Cod is a must-try, but skip the shishito peppers if you\'re looking for something unique."',
        likes: 0,
        comments: 0,
        dishes: [
            { id: 'd1', name: 'Miso Black Cod', price: '$38', rating: 5.0, sentiment: 'love', img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80' },
            { id: 'd2', name: 'Spicy Tuna Crispy Rice', price: '$24', rating: 4.8, sentiment: 'love', img: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&q=80' },
            { id: 'd3', name: 'Shishito Peppers', price: '$14', rating: 2.5, sentiment: 'leave', img: 'https://images.unsplash.com/photo-1550966871-3ed3c6227b42?w=400&q=80' },
        ],
        likedBy: [],
        commentsList: []
    },
    {
        id: 'r2',
        author: 'Sarah Miller',
        avatar: 'https://i.pravatar.cc/150?img=5',
        restaurantId: 'lilia',
        restaurantName: 'Lilia',
        location: 'Brooklyn, NY',
        time: '5h ago',
        text: '"Finally got a reservation! The pasta is worth the hype. Best cacio e pepe I\'ve ever had."',
        likes: 0,
        comments: 0,
        dishes: [
            { id: 'd4', name: 'Sheep\'s Milk Cheese Agnolotti', price: '$26', rating: 4.5, sentiment: 'love', img: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&q=80' },
            { id: 'd5', name: 'Chocolate Gelato', price: '$16', rating: 4.0, sentiment: 'love', img: 'https://images.unsplash.com/photo-1563805042-7684c8a9e1cb?w=400&q=80' },
        ],
        likedBy: [],
        commentsList: []
    },
    {
        id: 'r_alex_1',
        author: 'Alex Chen',
        avatar: 'https://i.pravatar.cc/150?img=32',
        restaurantId: 'lilia',
        restaurantName: 'Lilia',
        location: 'Brooklyn, NY',
        time: '1h ago',
        text: '"Testing my own review. The sheep\'s milk agnolotti is life-changing!"',
        likes: 5,
        comments: 2,
        dishes: [
            { id: 'd_alex_1', name: 'Sheep\'s Milk Cheese Agnolotti', price: '$26', rating: 5.0, sentiment: 'love', img: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&q=80' }
        ],
        likedBy: ['user_2'],
        commentsList: [
            { id: 'c1', author: 'Sarah Miller', avatar: 'https://i.pravatar.cc/150?img=5', text: 'Agree! Best dish there.', time: '30m ago' }
        ]
    }
];


const INITIAL_STATE = {
    isCreateReviewModalOpen: false,
    initialReviewRestaurantId: null,
    theme: 'light' as const,
    accentColor: '#f49d25',
    activeEditReviewId: null,
    activeEditDishId: null,
    currentUser: {
        id: 'user_1',
        email: 'alex.chen@example.com',
        name: 'Alex Chen',
        handle: 'alexeats',
        avatar: 'https://i.pravatar.cc/150?img=32',
        reviewCount: 142,
        followerCount: '8.5k',
        bio: 'Always hunting for the best spicy ramen in town. Amateur chef and professional eater. 🍜🌶️',
        location: 'San Francisco, CA',
        favCuisine: 'Japanese',
        savedRestaurants: [],
        foodTags: ['Japanese', 'Italian', 'Ramen', 'Seafood'],
        socialLinks: {
            instagram: 'alexeats',
            twitter: ''
        }
    },
    feedReviews: INITIAL_REVIEWS,
    isAuthenticated: false,
    searchResults: [],
    currentRestaurant: null,
    restaurantDetailsCache: {},
    toasts: []
};

export const useAppStore = create<AppState>((set, get) => ({
    ...INITIAL_STATE,

    setAuthStatus: (status) => set({ isAuthenticated: status }),

    signOut: async () => {
        try {
            await amplifySignOut();
        } catch (error) {
            console.error("Error signing out:", error);
        }
        set({
            currentUser: INITIAL_STATE.currentUser,
            isAuthenticated: false
        });
    },

    initApp: async () => {
        try {
            const session = await fetchAuthSession();
            if (session.tokens) {
                set({ isAuthenticated: true });
            } else {
                set({ isAuthenticated: false });
            }
        } catch (error) {
            console.error("No active auth session:", error);
            set({ isAuthenticated: false });
        }

        try {
            const reviews = await api.getReviews();
            if (reviews && reviews.length > 0) {
                set({ feedReviews: reviews });
            }
            const user = await api.getUser(get().currentUser.id);
            if (user && user.userId) {
                // Map ApiUser back to UserProfile
                set({ currentUser: { ...get().currentUser, ...user, id: user.userId } });
            }
        } catch (error) {
            console.error("Init app failed:", error);
        }
    },

    openCreateReviewModal: (restaurantId) => set({ isCreateReviewModalOpen: true, initialReviewRestaurantId: restaurantId || null }),
    closeCreateReviewModal: () => set({ isCreateReviewModalOpen: false, initialReviewRestaurantId: null }),

    toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        return { theme: newTheme };
    }),

    setAccentColor: (color: string) => {
        document.documentElement.style.setProperty('--primary', color);
        document.documentElement.style.setProperty('--primary-transparent', color + '33');
        localStorage.setItem('platemate-accent-color', color);
        set({ accentColor: color });
    },

    openEditModal: (eventId, dishId) => set({
        activeEditReviewId: eventId,
        activeEditDishId: dishId ?? null
    }),
    closeEditModal: () => set({
        activeEditReviewId: null,
        activeEditDishId: null
    }),

    addReview: async (newReviewData) => {
        const newReview: DiningEvent = {
            ...newReviewData,
            id: `r_${Date.now()}`,
            author: get().currentUser.name,
            avatar: get().currentUser.avatar,
            likes: 0,
            comments: 0,
            likedBy: [],
            commentsList: []
        };

        try {
            await api.createReview(newReview);

            // Auto-save the restaurant if it's not already saved
            const currentSaved = get().currentUser.savedRestaurants || [];
            if (!currentSaved.includes(newReviewData.restaurantId)) {
                const newSaved = [...currentSaved, newReviewData.restaurantId];
                await get().updateCurrentUser({ savedRestaurants: newSaved });
            }

            set((state) => ({
                feedReviews: [newReview, ...state.feedReviews],
                currentUser: { ...state.currentUser, reviewCount: state.currentUser.reviewCount + 1 }
            }));
        } catch (error) {
            console.error("Add review failed:", error);
        }
    },

    updateReview: async (eventId, updatedData) => {
        try {
            // Optimistic update
            set((state) => ({
                feedReviews: state.feedReviews.map(review =>
                    review.id === eventId ? { ...review, ...updatedData } : review
                )
            }));
            await api.createReview({ id: eventId, ...updatedData });
        } catch (error) {
            console.error("Update review failed:", error);
        }
    },

    deleteReview: async (eventId) => {
        try {
            await api.deleteReview(eventId);
            set((state) => {
                const reviewToDelete = state.feedReviews.find(r => r.id === eventId);
                const isOwnReview = reviewToDelete?.author === state.currentUser.name;

                return {
                    feedReviews: state.feedReviews.filter(r => r.id !== eventId),
                    currentUser: isOwnReview ? {
                        ...state.currentUser,
                        reviewCount: Math.max(0, state.currentUser.reviewCount - 1)
                    } : state.currentUser
                };
            });
        } catch (error) {
            console.error("Delete review failed:", error);
        }
    },

    toggleLike: async (eventId) => {
        const userId = get().currentUser.id;
        try {
            const result = await api.toggleLike(eventId, userId);
            set((state) => ({
                feedReviews: state.feedReviews.map(review => {
                    if (review.id !== eventId) return review;
                    return { ...review, likedBy: result.likedBy, likes: result.likes };
                })
            }));
        } catch (error) {
            console.error("Toggle like failed:", error);
        }
    },

    addComment: async (eventId, text) => {
        try {
            await api.addComment(eventId, get().currentUser.name, text);
            set((state) => ({
                feedReviews: state.feedReviews.map(review => {
                    if (review.id !== eventId) return review;
                    const newComment: Comment = {
                        id: `c_${Date.now()}`,
                        author: state.currentUser.name,
                        avatar: state.currentUser.avatar,
                        text,
                        time: 'Just now'
                    };
                    return {
                        ...review,
                        comments: review.comments + 1,
                        commentsList: [...review.commentsList, newComment]
                    };
                })
            }));
        } catch (error) {
            console.error("Add comment failed:", error);
        }
    },

    updateCurrentUser: async (updates) => {
        try {
            await api.updateUser(get().currentUser.id, updates);
            set((state) => ({
                currentUser: { ...state.currentUser, ...updates }
            }));
        } catch (error) {
            console.error("Update user failed:", error);
        }
    },

    updateUserAvatar: async (fileOrUrl: File | string | null) => {
        try {
            let finalUrl = '';
            if (fileOrUrl instanceof File) {
                const { uploadUrl, publicUrl } = await api.getAvatarUploadUrl(get().currentUser.id, fileOrUrl.name, fileOrUrl.type);
                await api.uploadToS3(uploadUrl, fileOrUrl);
                finalUrl = publicUrl;
            } else {
                finalUrl = fileOrUrl || 'https://i.pravatar.cc/150?img=placeholder'; // Default placeholder
            }

            await api.updateUser(get().currentUser.id, { avatar: finalUrl });
            set((state) => ({
                currentUser: { ...state.currentUser, avatar: finalUrl }
            }));
        } catch (error) {
            console.error("Avatar status change failed:", error);
        }
    },

    searchRestaurants: async (query, location) => {
        try {
            const results = await api.searchRestaurants(query, location);
            set({ searchResults: results });
        } catch (error) {
            console.error("Search restaurants failed:", error);
            set({ searchResults: [] });
        }
    },

    fetchRestaurantDetails: async (placeId) => {
        try {
            const details = await api.getRestaurantDetails(placeId);
            set((state) => ({
                currentRestaurant: details,
                restaurantDetailsCache: {
                    ...state.restaurantDetailsCache,
                    [placeId]: details
                }
            }));
        } catch (error) {
            console.error("Fetch restaurant details failed:", error);
        }
    },

    fetchSavedRestaurantDetails: async (placeIds) => {
        const state = get();
        const idsToFetch = placeIds.filter(id => !state.restaurantDetailsCache[id]);

        if (idsToFetch.length === 0) return;

        try {
            // Fetch missing details concurrently
            const results = await Promise.all(
                idsToFetch.map(id => api.getRestaurantDetails(id).catch(() => null))
            );

            const newCache = { ...state.restaurantDetailsCache };
            results.forEach((details, index) => {
                if (details) {
                    newCache[idsToFetch[index]] = details;
                }
            });

            set({ restaurantDetailsCache: newCache });
        } catch (error) {
            console.error("Fetch saved restaurant details failed:", error);
        }
    },

    toggleSavedRestaurant: async (placeId) => {
        const saved = get().currentUser.savedRestaurants || [];
        const isSaved = saved.includes(placeId);
        const newSaved = isSaved
            ? saved.filter(id => id !== placeId)
            : [...saved, placeId];

        try {
            await get().updateCurrentUser({ savedRestaurants: newSaved });
        } catch (error) {
            console.error("Toggle saved restaurant failed:", error);
        }
    },

    addToast: (message: string, type: ToastType) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        set((state) => ({
            toasts: [...state.toasts, { id, message, type }]
        }));
    },

    removeToast: (id: string) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
        }));
    },

    uploadRestaurantHeader: async (placeId: string, file: File) => {
        try {
            // 1. Get presigned URL
            const { uploadUrl, publicUrl } = await api.getRestaurantHeaderUploadUrl(
                placeId,
                file.name,
                file.type
            );

            // 2. Upload to S3
            await api.uploadToS3(uploadUrl, file);

            // 3. Update restaurant details record via PUT
            await api.updateRestaurantDetails(placeId, { customHeaderImage: publicUrl });

            // 4. Update local cache
            const state = get();
            const existingDetails = state.restaurantDetailsCache[placeId] ||
                (state.currentRestaurant?.place_id === placeId ? state.currentRestaurant : null);

            if (existingDetails) {
                const updatedDetails = { ...existingDetails, customHeaderImage: publicUrl };
                set({
                    restaurantDetailsCache: {
                        ...state.restaurantDetailsCache,
                        [placeId]: updatedDetails
                    },
                    currentRestaurant: state.currentRestaurant?.place_id === placeId ? updatedDetails : state.currentRestaurant
                });
            } else {
                // Fallback if not cached yet for some reason
                get().fetchRestaurantDetails(placeId);
            }

        } catch (error) {
            console.error("Restaurant header upload failed:", error);
            throw error;
        }
    }

}));

(useAppStore as any).getInitialState = () => INITIAL_STATE;

// Initialize theme and accent color on load
(() => {
    if (typeof document !== 'undefined') {
        const state = useAppStore.getState();
        document.documentElement.setAttribute('data-theme', state.theme);

        const savedColor = localStorage.getItem('platemate-accent-color');
        if (savedColor) {
            useAppStore.setState({ accentColor: savedColor });
            document.documentElement.style.setProperty('--primary', savedColor);
            document.documentElement.style.setProperty('--primary-transparent', savedColor + '33');
        }
    }
})();

