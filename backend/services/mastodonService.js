const axios = require('axios');

class MastodonService {
  constructor() {
    this.clientId = process.env.MASTODON_CLIENT_ID;
    this.clientSecret = process.env.MASTODON_CLIENT_SECRET;
    this.redirectUri = process.env.MASTODON_REDIRECT_URI;
    this.instanceUrl = process.env.MASTODON_INSTANCE_URL || 'https://mastodon.social';
  }

  // Generate OAuth2 authorization URL
  getAuthUrl(state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: 'read write follow',
      state: state
    });

    return `${this.instanceUrl}/oauth/authorize?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async getAccessToken(code) {
    try {
      const response = await axios.post(`${this.instanceUrl}/oauth/token`, {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Mastodon token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to get Mastodon access token');
    }
  }

  // Get user information
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(`${this.instanceUrl}/api/v1/accounts/verify_credentials`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Mastodon user info error:', error.response?.data || error.message);
      throw new Error('Failed to get Mastodon user info');
    }
  }

  // Create a post (status)
  async createPost(accessToken, content, options = {}) {
    try {
      const postData = {
        status: content,
        visibility: options.visibility || 'public', // public, unlisted, private, direct
        sensitive: options.sensitive || false,
        spoiler_text: options.spoilerText || '',
        language: options.language || 'en'
      };

      // Add media attachments if provided
      if (options.mediaIds && options.mediaIds.length > 0) {
        postData.media_ids = options.mediaIds;
      }

      // Add poll if provided
      if (options.poll) {
        postData.poll = options.poll;
      }

      const response = await axios.post(`${this.instanceUrl}/api/v1/statuses`, postData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Mastodon post creation error:', error.response?.data || error.message);
      throw new Error('Failed to create Mastodon post');
    }
  }

  // Upload media file
  async uploadMedia(accessToken, fileBuffer, fileName, description = '') {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, fileName);
      formData.append('description', description);

      const response = await axios.post(`${this.instanceUrl}/api/v1/media`, formData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Mastodon media upload error:', error.response?.data || error.message);
      throw new Error('Failed to upload media to Mastodon');
    }
  }

  // Get post engagement metrics
  async getPostEngagement(accessToken, postId) {
    try {
      const response = await axios.get(`${this.instanceUrl}/api/v1/statuses/${postId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const post = response.data;
      return {
        id: post.id,
        content: post.content,
        favourites: post.favourites_count,
        boosts: post.reblogs_count,
        replies: post.replies_count,
        created: post.created_at,
        visibility: post.visibility,
        sensitive: post.sensitive,
        spoilerText: post.spoiler_text,
        url: post.url,
        account: {
          id: post.account.id,
          username: post.account.username,
          displayName: post.account.display_name,
          avatar: post.account.avatar
        }
      };
    } catch (error) {
      console.error('Mastodon engagement error:', error.response?.data || error.message);
      throw new Error('Failed to get Mastodon post engagement');
    }
  }

  // Get user's posts
  async getUserPosts(accessToken, accountId, limit = 20) {
    try {
      const response = await axios.get(`${this.instanceUrl}/api/v1/accounts/${accountId}/statuses?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data.map(post => ({
        id: post.id,
        content: post.content,
        favourites: post.favourites_count,
        boosts: post.reblogs_count,
        replies: post.replies_count,
        created: post.created_at,
        visibility: post.visibility,
        url: post.url,
        media: post.media_attachments
      }));
    } catch (error) {
      console.error('Mastodon user posts error:', error.response?.data || error.message);
      throw new Error('Failed to get Mastodon user posts');
    }
  }

  // Delete a post
  async deletePost(accessToken, postId) {
    try {
      const response = await axios.delete(`${this.instanceUrl}/api/v1/statuses/${postId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Mastodon delete post error:', error.response?.data || error.message);
      throw new Error('Failed to delete Mastodon post');
    }
  }

  // Edit a post
  async editPost(accessToken, postId, content, options = {}) {
    try {
      const postData = {
        status: content,
        visibility: options.visibility || 'public',
        sensitive: options.sensitive || false,
        spoiler_text: options.spoilerText || '',
        language: options.language || 'en'
      };

      if (options.mediaIds && options.mediaIds.length > 0) {
        postData.media_ids = options.mediaIds;
      }

      const response = await axios.put(`${this.instanceUrl}/api/v1/statuses/${postId}`, postData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Mastodon edit post error:', error.response?.data || error.message);
      throw new Error('Failed to edit Mastodon post');
    }
  }

  // Boost a post
  async boostPost(accessToken, postId) {
    try {
      const response = await axios.post(`${this.instanceUrl}/api/v1/statuses/${postId}/reblog`, {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Mastodon boost post error:', error.response?.data || error.message);
      throw new Error('Failed to boost Mastodon post');
    }
  }

  // Favourite a post
  async favouritePost(accessToken, postId) {
    try {
      const response = await axios.post(`${this.instanceUrl}/api/v1/statuses/${postId}/favourite`, {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Mastodon favourite post error:', error.response?.data || error.message);
      throw new Error('Failed to favourite Mastodon post');
    }
  }
}

module.exports = new MastodonService(); 