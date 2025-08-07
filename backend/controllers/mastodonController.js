const mastodonService = require('../services/mastodonService');
const User = require('../models/User');
const Post = require('../models/PostModel');
const { upload } = require('../config/cloudinary');
const crypto = require('crypto');

// Generate OAuth2 authorization URL
const getAuthUrl = async (req, res) => {
  try {
    const { instanceUrl } = req.query;
    const state = crypto.randomBytes(32).toString('hex');
    
    // Set instance URL for this session
    req.session.mastodonInstanceUrl = instanceUrl || 'https://mastodon.social';
    
    const authUrl = mastodonService.getAuthUrl(state);
    
    res.json({
      success: true,
      authUrl,
      state
    });
  } catch (error) {
    console.error('Mastodon auth URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Mastodon authorization URL'
    });
  }
};

// Handle OAuth2 callback
const handleCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    const { userId } = req.body;
    const instanceUrl = req.session.mastodonInstanceUrl || 'https://mastodon.social';

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Mastodon authorization was denied'
      });
    }

    if (!code || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code or user ID'
      });
    }

    // Exchange code for access token
    const tokenData = await mastodonService.getAccessToken(code);
    
    // Get user info
    const userInfo = await mastodonService.getUserInfo(tokenData.access_token);
    
    // Update user with Mastodon credentials
    const user = await User.findByIdAndUpdate(
      userId,
      {
        mastodonAccessToken: tokenData.access_token,
        mastodonInstanceUrl: instanceUrl,
        mastodonUsername: userInfo.username,
        mastodonUserId: userInfo.id
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Mastodon account connected successfully',
      user: {
        id: user._id,
        mastodonUsername: user.mastodonUsername,
        mastodonInstanceUrl: user.mastodonInstanceUrl,
        connectedPlatforms: user.getConnectedPlatforms()
      }
    });
  } catch (error) {
    console.error('Mastodon callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect Mastodon account'
    });
  }
};

// Create Mastodon post
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
        description,
        visibility,
        spoilerText,
        postType,
        date,
        tags
      } = req.body;

      if (!userId || !description || !date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      // Check if user has Mastodon connected
      const user = await User.findById(userId);
      if (!user.hasPlatformConnected('mastodon')) {
        return res.status(400).json({
          success: false,
          error: 'Mastodon account not connected'
        });
      }

      // Create post
      const newPost = new Post({
        userId,
        description,
        visibility: visibility || 'public',
        spoilerText: spoilerText || '',
        platform: 'mastodon',
        postType: 'status',
        date: new Date(date),
        image: req.file?.path || '',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : []
      });

      await newPost.save();

      res.status(201).json({
        success: true,
        message: 'Mastodon post created successfully',
        post: newPost
      });
    });
  } catch (error) {
    console.error('Mastodon post creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Mastodon post'
    });
  }
};

// Get user's Mastodon posts
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user has Mastodon connected
    const user = await User.findById(userId);
    if (!user.hasPlatformConnected('mastodon')) {
      return res.status(400).json({
        success: false,
        error: 'Mastodon account not connected'
      });
    }

    // Get posts from Mastodon API
    const mastodonPosts = await mastodonService.getUserPosts(
      user.mastodonAccessToken,
      user.mastodonUserId,
      req.query.limit || 20
    );

    // Get posts from our database
    const dbPosts = await Post.find({
      userId,
      platform: 'mastodon'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      mastodonPosts,
      dbPosts
    });
  } catch (error) {
    console.error('Mastodon user posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Mastodon posts'
    });
  }
};

// Get post engagement
const getPostEngagement = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.query;

    // Check if user has Mastodon connected
    const user = await User.findById(userId);
    if (!user.hasPlatformConnected('mastodon')) {
      return res.status(400).json({
        success: false,
        error: 'Mastodon account not connected'
      });
    }

    // Get engagement from Mastodon API
    const engagement = await mastodonService.getPostEngagement(
      user.mastodonAccessToken,
      postId
    );

    // Update engagement in our database
    const post = await Post.findOne({ platformPostId: postId });
    if (post) {
      await post.updateEngagement({
        favourites: engagement.favourites,
        boosts: engagement.boosts,
        replies: engagement.replies
      });
    }

    res.json({
      success: true,
      engagement
    });
  } catch (error) {
    console.error('Mastodon engagement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Mastodon post engagement'
    });
  }
};

// Delete Mastodon post
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    // Check if user has Mastodon connected
    const user = await User.findById(userId);
    if (!user.hasPlatformConnected('mastodon')) {
      return res.status(400).json({
        success: false,
        error: 'Mastodon account not connected'
      });
    }

    // Delete from Mastodon
    await mastodonService.deletePost(user.mastodonAccessToken, postId);

    // Delete from our database
    await Post.findByIdAndDelete(postId);

    res.json({
      success: true,
      message: 'Mastodon post deleted successfully'
    });
  } catch (error) {
    console.error('Mastodon delete post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete Mastodon post'
    });
  }
};

// Edit Mastodon post
const editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, newContent, visibility, spoilerText } = req.body;

    // Check if user has Mastodon connected
    const user = await User.findById(userId);
    if (!user.hasPlatformConnected('mastodon')) {
      return res.status(400).json({
        success: false,
        error: 'Mastodon account not connected'
      });
    }

    // Edit on Mastodon
    const result = await mastodonService.editPost(
      user.mastodonAccessToken,
      postId,
      newContent,
      { visibility, spoilerText }
    );

    // Update in our database
    const post = await Post.findByIdAndUpdate(
      postId,
      { 
        description: newContent,
        visibility: visibility || 'public',
        spoilerText: spoilerText || ''
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Mastodon post edited successfully',
      post
    });
  } catch (error) {
    console.error('Mastodon edit post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to edit Mastodon post'
    });
  }
};

// Boost a Mastodon post
const boostPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    // Check if user has Mastodon connected
    const user = await User.findById(userId);
    if (!user.hasPlatformConnected('mastodon')) {
      return res.status(400).json({
        success: false,
        error: 'Mastodon account not connected'
      });
    }

    // Boost on Mastodon
    const result = await mastodonService.boostPost(
      user.mastodonAccessToken,
      postId
    );

    res.json({
      success: true,
      message: 'Mastodon post boosted successfully',
      result
    });
  } catch (error) {
    console.error('Mastodon boost post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to boost Mastodon post'
    });
  }
};

// Favourite a Mastodon post
const favouritePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    // Check if user has Mastodon connected
    const user = await User.findById(userId);
    if (!user.hasPlatformConnected('mastodon')) {
      return res.status(400).json({
        success: false,
        error: 'Mastodon account not connected'
      });
    }

    // Favourite on Mastodon
    const result = await mastodonService.favouritePost(
      user.mastodonAccessToken,
      postId
    );

    res.json({
      success: true,
      message: 'Mastodon post favourited successfully',
      result
    });
  } catch (error) {
    console.error('Mastodon favourite post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to favourite Mastodon post'
    });
  }
};

// Disconnect Mastodon account
const disconnectAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        mastodonAccessToken: null,
        mastodonInstanceUrl: null,
        mastodonUsername: null,
        mastodonUserId: null
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Mastodon account disconnected successfully',
      user: {
        id: user._id,
        connectedPlatforms: user.getConnectedPlatforms()
      }
    });
  } catch (error) {
    console.error('Mastodon disconnect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Mastodon account'
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
  boostPost,
  favouritePost,
  disconnectAccount
}; 