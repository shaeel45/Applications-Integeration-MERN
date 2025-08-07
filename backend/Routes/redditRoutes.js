const express = require("express");
const router = express.Router();
const {
  getAuthUrl,
  handleCallback,
  createPost,
  getUserPosts,
  getPostEngagement,
  deletePost,
  editPost,
  disconnectAccount
} = require("../controllers/redditController");
const redditService = require('../services/redditService');


// OAuth2 authentication routes
router.get("/auth", getAuthUrl);
// router.get("/reddit/callback", handleCallback);
router.post('/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    // Exchange code for access token
    const tokenData = await redditService.getAccessToken(code);
    // Optionally get user info, save token, etc.
    res.json({ success: true, token: tokenData.access_token });
  } catch (error) {
    console.error('Reddit callback error:', error);
    res.status(500).json({ success: false, error: 'Failed to connect Reddit account' });
  }
});
// Post management routes
router.post("/reddit/posts", createPost);
router.get("/reddit/posts/:userId", getUserPosts);
router.get("/reddit/posts/engagement/:postId", getPostEngagement);
router.delete("/reddit/posts/:postId", deletePost);
router.put("/reddit/posts/:postId", editPost);

// Account management routes
router.delete("/reddit/disconnect/:userId", disconnectAccount);

module.exports = router; 