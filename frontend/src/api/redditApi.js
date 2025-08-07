import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with base configuration
const redditApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
redditApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('reddit_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
redditApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Reddit API methods
export const redditApiService = {
  // Get OAuth authorization URL
  getAuthUrl: async () => {
    try {
      const response = await redditApi.get('/reddit/auth');
      return response.data;
    } catch (error) {
      console.error('Error getting Reddit auth URL:', error);
      throw error;
    }
  },

  // Handle OAuth callback
  handleCallback: async (code, state) => {
    try {
      const response = await redditApi.post('/reddit/callback', { code, state });
      return response.data;
    } catch (error) {
      console.error('Error handling Reddit callback:', error);
      throw error;
    }
  },

  // Create a new post
  createPost: async (postData) => {
    try {
      const formData = new FormData();
      
      // Add text content
      formData.append('title', postData.title);
      formData.append('content', postData.content);
      formData.append('subreddit', postData.subreddit);
      formData.append('postType', postData.postType || 'text');
      
      // Add media files if any
      if (postData.media && postData.media.length > 0) {
        postData.media.forEach((file, index) => {
          formData.append('media', file);
        });
      }

      const response = await redditApi.post('/reddit/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating Reddit post:', error);
      throw error;
    }
  },

  // Get user's posts
  getUserPosts: async (userId) => {
    try {
      const response = await redditApi.get(`/reddit/posts/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting Reddit posts:', error);
      throw error;
    }
  },

  // Get post engagement metrics
  getPostEngagement: async (postId) => {
    try {
      const response = await redditApi.get(`/reddit/posts/engagement/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting Reddit post engagement:', error);
      throw error;
    }
  },

  // Delete a post
  deletePost: async (postId) => {
    try {
      const response = await redditApi.delete(`/reddit/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting Reddit post:', error);
      throw error;
    }
  },

  // Edit a post
  editPost: async (postId, postData) => {
    try {
      const response = await redditApi.put(`/reddit/posts/${postId}`, postData);
      return response.data;
    } catch (error) {
      console.error('Error editing Reddit post:', error);
      throw error;
    }
  },

  // Disconnect Reddit account
  disconnectAccount: async (userId) => {
    try {
      const response = await redditApi.delete(`/reddit/disconnect/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error disconnecting Reddit account:', error);
      throw error;
    }
  },
};

export default redditApiService;