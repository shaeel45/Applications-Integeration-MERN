const redditService = require('../services/redditService');
const User = require('../models/User');
const Post = require('../models/PostModel');
const { upload } = require('../config/cloudinary');
const crypto = require('crypto');

// Generate OAuth2 authorization URL
const getAuthUrl = async (req, res) => {
  try {
    const state = crypto.randomBytes(32).toString('hex');
    const authUrl = redditService.getAuthUrl(state);
    
    res.json({
      success: true,
      authUrl,
      state
    });
  } catch (error) {
    console.error('Reddit auth URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Reddit authorization URL'
    });
  }
};

// Handle OAuth2 callback
const handleCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    const { userId } = req.body;

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Reddit authorization was denied'
      });
    }

    if (!code || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code or user ID'
      });
    }

    // Exchange code for access token
    const tokenData = await redditService.getAccessToken(code);
    
    // Get user info
    const userInfo = await redditService.getUserInfo(tokenData.access_token);
    
    // Update user with Reddit credentials
    const user = await User.findByIdAndUpdate(
      userId,
      {
        redditAccessToken: tokenData.access_token,
        redditRefreshToken: tokenData.refresh_token,
        redditTokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
        redditUsername: userInfo.name,
        redditUserId: userInfo.id
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Reddit account connected successfully',
      user: {
        id: user._id,
        redditUsername: user.redditUsername,
        connectedPlatforms: user.getConnectedPlatforms()
      }
    });
  } catch (error) {
    console.error('Reddit callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect Reddit account'
    });
  }
};

// Create Reddit post
const createPost = async (req, res) => {
  try {
    upload.single('image')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: 'File upload error: ' + err.message
        });
      }

      const {
        userId,
        title,
        description,
        subreddit,
        postType,
        date,
        tags
      } = req.body;

      if (!userId || !description || !subreddit || !date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      // Check if user has Reddit connected
      const user = await User.findById(userId);
      if (!user.hasPlatformConnected('reddit')) {
        return res.status(400).json({
          success: false,
          error: 'Reddit account not connected'
        });
      }

      // Create post
      const newPost = new Post({
        userId,
        title: title || description.substring(0, 300), // Reddit title limit
        description,
        subreddit,
        platform: 'reddit',
        postType: 'subreddit',
        date: new Date(date),
        image: req.file?.path || '',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : []
      });

      await newPost.save();

      res.status(201).json({
        success: true,
        message: 'Reddit post created successfully',
        post: newPost
      });
    });
  } catch (error) {
    console.error('Reddit post creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Reddit post'
    });
  }
};

// Get user's Reddit posts
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user has Reddit connected
    const user = await User.findById(userId);
    if (!user.hasPlatformConnected('reddit')) {
      return res.status(400).json({
        success: false,
        error: 'Reddit account not connected'
      });
    }

    // Get posts from Reddit API
    const redditPosts = await redditService.getUserPosts(
      user.redditAccessToken,
      user.redditUsername,
      req.query.limit || 25
    );

    // Get posts from our database
    const dbPosts = await Post.find({
      userId,
      platform: 'reddit'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      redditPosts,
      dbPosts
    });
  } catch (error) {
    console.error('Reddit user posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Reddit posts'
    });
  }
};

// Get post engagement
const getPostEngagement = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.query;

    // Check if user has Reddit connected
    const user = await User.findById(userId);
    if (!user.hasPlatformConnected('reddit')) {
      return res.status(400).json({
        success: false,
        error: 'Reddit account not connected'
      });
    }

    // Get engagement from Reddit API
    const engagement = await redditService.getPostEngagement(
      user.redditAccessToken,
      postId
    );

    // Update engagement in our database
    const post = await Post.findOne({ platformPostId: postId });
    if (post) {
      await post.updateEngagement({
        upvotes: engagement.upvotes,
        downvotes: engagement.downs,
        score: engagement.score,
        comments: engagement.comments,
        upvoteRatio: engagement.upvoteRatio
      });
    }

    res.json({
      success: true,
      engagement
    });
  } catch (error) {
    console.error('Reddit engagement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Reddit post engagement'
    });
  }
};

// Delete Reddit post
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    // Check if user has Reddit connected
    const user = await User.findById(userId);
    if (!user.hasPlatformConnected('reddit')) {
      return res.status(400).json({
        success: false,
        error: 'Reddit account not connected'
      });
    }

    // Delete from Reddit
    await redditService.deletePost(user.redditAccessToken, postId);

    // Delete from our database
    await Post.findByIdAndDelete(postId);

    res.json({
      success: true,
      message: 'Reddit post deleted successfully'
    });
  } catch (error) {
    console.error('Reddit delete post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete Reddit post'
    });
  }
};

// Edit Reddit post
const editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, newContent } = req.body;

    // Check if user has Reddit connected
    const user = await User.findById(userId);
    if (!user.hasPlatformConnected('reddit')) {
      return res.status(400).json({
        success: false,
        error: 'Reddit account not connected'
      });
    }

    // Edit on Reddit
    const result = await redditService.editPost(
      user.redditAccessToken,
      postId,
      newContent
    );

    // Update in our database
    const post = await Post.findByIdAndUpdate(
      postId,
      { description: newContent },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Reddit post edited successfully',
      post
    });
  } catch (error) {
    console.error('Reddit edit post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to edit Reddit post'
    });
  }
};

// Disconnect Reddit account
const disconnectAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        redditAccessToken: null,
        redditRefreshToken: null,
        redditTokenExpiry: null,
        redditUsername: null,
        redditUserId: null
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Reddit account disconnected successfully',
      user: {
        id: user._id,
        connectedPlatforms: user.getConnectedPlatforms()
      }
    });
  } catch (error) {
    console.error('Reddit disconnect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Reddit account'
    });
  }
};

module.exports = {
  getAuthUrl,
  handleCallback,
  createPost,
  getUserPosts,
  getPostEngagement,
  deletePost,
  editPost,
  disconnectAccount
}; 