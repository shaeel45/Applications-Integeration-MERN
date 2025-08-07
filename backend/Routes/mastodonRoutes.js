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
  boostPost,
  favouritePost,
  disconnectAccount
} = require("../controllers/mastodonController");

// OAuth2 authentication routes
router.post("/auth", getAuthUrl);
router.post("/callback", handleCallback);

// Post management routes
router.post("/mastodon/posts", createPost);
router.get("/mastodon/posts/:userId", getUserPosts);
router.get("/mastodon/posts/engagement/:postId", getPostEngagement);
router.delete("/mastodon/posts/:postId", deletePost);
router.put("/mastodon/posts/:postId", editPost);

// Engagement actions
router.post("/mastodon/posts/:postId/boost", boostPost);
router.post("/mastodon/posts/:postId/favourite", favouritePost);

// Account management routes
router.delete("/mastodon/disconnect/:userId", disconnectAccount);

module.exports = router; 