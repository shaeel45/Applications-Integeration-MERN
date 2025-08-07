const axios = require('axios');
const crypto = require('crypto');
const snoowrap = require('snoowrap');

class RedditService {
  constructor() {
    this.clientId = process.env.REDDIT_CLIENT_ID;
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET;
    this.redirectUri = process.env.REDDIT_REDIRECT_URI;
    this.userAgent = 'ReachWay/1.0 (by /u/your_username)';
  }

  // Generate OAuth2 authorization URL
  getAuthUrl(state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      state: state,
      redirect_uri: this.redirectUri,
      duration: 'permanent',
      scope: 'identity submit read'
    });

    return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async getAccessToken(code) {
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri
    });

    const response = await axios.post('https://www.reddit.com/api/v1/access_token', params, {
      auth: {
        username: this.clientId,
        password: this.clientSecret
      },
      headers: {
        'User-Agent': this.userAgent,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Reddit token exchange error:', error.response?.data || error.message);
    throw new Error('Failed to get Reddit access token');
  }
}

  // Refresh access token
  async refreshToken(refreshToken) {
  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    const response = await axios.post('https://www.reddit.com/api/v1/access_token', params, {
      auth: {
        username: this.clientId,
        password: this.clientSecret
      },
      headers: {
        'User-Agent': this.userAgent,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Reddit token refresh error:', error.response?.data || error.message);
    throw new Error('Failed to refresh Reddit access token');
  }
}

  // Get user information
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get('https://oauth.reddit.com/api/v1/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent
        }
      });

      return response.data;
    } catch (error) {
      console.error('Reddit user info error:', error.response?.data || error.message);
      throw new Error('Failed to get Reddit user info');
    }
  }

  // Submit a post to Reddit
  async submitPost(accessToken, subreddit, title, content, kind = 'self') {
    try {
      const postData = {
        sr: subreddit,
        title: title,
        kind: kind, // 'self' for text, 'link' for URL, 'image' for image
        text: content
      };

      const response = await axios.post('https://oauth.reddit.com/api/submit', postData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Reddit post submission error:', error.response?.data || error.message);
      throw new Error('Failed to submit Reddit post');
    }
  }

  // Get post engagement metrics
  async getPostEngagement(accessToken, postId) {
    try {
      const response = await axios.get(`https://oauth.reddit.com/api/info.json?id=t3_${postId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent
        }
      });

      const post = response.data.data.children[0]?.data;
      if (!post) {
        throw new Error('Post not found');
      }

      return {
        upvotes: post.ups,
        downvotes: post.downs,
        score: post.score,
        comments: post.num_comments,
        upvoteRatio: post.upvote_ratio,
        created: post.created_utc,
        title: post.title,
        url: post.url,
        permalink: post.permalink
      };
    } catch (error) {
      console.error('Reddit engagement error:', error.response?.data || error.message);
      throw new Error('Failed to get Reddit post engagement');
    }
  }

  // Get user's posts
  async getUserPosts(accessToken, username, limit = 25) {
    try {
      const response = await axios.get(`https://oauth.reddit.com/user/${username}/submitted.json?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent
        }
      });

      return response.data.data.children.map(child => ({
        id: child.data.id,
        title: child.data.title,
        subreddit: child.data.subreddit,
        score: child.data.score,
        comments: child.data.num_comments,
        created: child.data.created_utc,
        url: child.data.url,
        permalink: child.data.permalink,
        upvoteRatio: child.data.upvote_ratio
      }));
    } catch (error) {
      console.error('Reddit user posts error:', error.response?.data || error.message);
      throw new Error('Failed to get Reddit user posts');
    }
  }

  // Delete a post
  async deletePost(accessToken, postId) {
    try {
      const response = await axios.post('https://oauth.reddit.com/api/del', {
        id: `t3_${postId}`
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Reddit delete post error:', error.response?.data || error.message);
      throw new Error('Failed to delete Reddit post');
    }
  }

  // Edit a post
  async editPost(accessToken, postId, newContent) {
    try {
      const response = await axios.post('https://oauth.reddit.com/api/editusertext', {
        thing_id: `t3_${postId}`,
        text: newContent
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Reddit edit post error:', error.response?.data || error.message);
      throw new Error('Failed to edit Reddit post');
    }
  }
}

module.exports = new RedditService(); 