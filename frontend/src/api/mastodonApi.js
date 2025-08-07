import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with base configuration
const mastodonApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
mastodonApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
mastodonApi.interceptors.response.use(
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

// Mastodon API methods
export const mastodonApiService = {
  // Get OAuth authorization URL
  getAuthUrl: async (instanceUrl) => {
    try {
      const response = await mastodonApi.post('/mastodon/auth', { instanceUrl });
      return response.data;
    } catch (error) {
      console.error('Error getting Mastodon auth URL:', error);
      throw error;
    }
  },

  // Handle OAuth callback
  handleCallback: async (code, state, instanceUrl) => {
    try {
      const response = await mastodonApi.post('/mastodon/callback', { 
        code, 
        state, 
        instanceUrl 
      });
      return response.data;
    } catch (error) {
      console.error('Error handling Mastodon callback:', error);
      throw error;
    }
  },

  // Create a new post (status)
  createPost: async (postData) => {
    try {
      const formData = new FormData();
      
      // Add text content
      formData.append('content', postData.content);
      formData.append('visibility', postData.visibility || 'public');
      
      // Add spoiler text if provided
      if (postData.spoilerText) {
        formData.append('spoilerText', postData.spoilerText);
      }
      
      // Add media files if any
      if (postData.media && postData.media.length > 0) {
        postData.media.forEach((file, index) => {
          formData.append('media', file);
        });
      }

      const response = await mastodonApi.post('/mastodon/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating Mastodon post:', error);
      throw error;
    }
  },

  // Get user's posts
  getUserPosts: async (userId) => {
    try {
      const response = await mastodonApi.get(`/mastodon/posts/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting Mastodon posts:', error);
      throw error;
    }
  },

  // Get post engagement metrics
  getPostEngagement: async (postId) => {
    try {
      const response = await mastodonApi.get(`/mastodon/posts/engagement/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting Mastodon post engagement:', error);
      throw error;
    }
  },

  // Delete a post
  deletePost: async (postId) => {
    try {
      const response = await mastodonApi.delete(`/mastodon/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting Mastodon post:', error);
      throw error;
    }
  },

  // Edit a post
  editPost: async (postId, postData) => {
    try {
      const response = await mastodonApi.put(`/mastodon/posts/${postId}`, postData);
      return response.data;
    } catch (error) {
      console.error('Error editing Mastodon post:', error);
      throw error;
    }
  },

  // Boost a post
  boostPost: async (postId) => {
    try {
      const response = await mastodonApi.post(`/mastodon/posts/${postId}/boost`);
      return response.data;
    } catch (error) {
      console.error('Error boosting Mastodon post:', error);
      throw error;
    }
  },

  // Favourite a post
  favouritePost: async (postId) => {
    try {
      const response = await mastodonApi.post(`/mastodon/posts/${postId}/favourite`);
      return response.data;
    } catch (error) {
      console.error('Error favouriting Mastodon post:', error);
      throw error;
    }
  },

  // Disconnect Mastodon account
  disconnectAccount: async (userId) => {
    try {
      const response = await mastodonApi.delete(`/mastodon/disconnect/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error disconnecting Mastodon account:', error);
      throw error;
    }
  },
};

export default mastodonApiService; 