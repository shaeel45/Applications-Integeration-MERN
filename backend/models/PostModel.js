const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
      required: true,
    },
    // postId: {
    //   type: String,
    //   required: true,
    // },
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String, // Mongoose `String` is equivalent to Sequelize `TEXT`
      default: "",
    },
    pageID: {
      type: String, // Storing page/account ID
      default: "",
    },
    image: {
      type: String, // Storing Cloudinary URL
      default: "",
    },
    // New fields for Reddit
    subreddit: {
      type: String,
      default: "",
    },
    // New fields for Mastodon
    visibility: {
      type: String,
      enum: ['public', 'unlisted', 'private', 'direct'],
      default: 'public',
    },
    spoilerText: {
      type: String,
      default: "",
    },
    // Platform and post type
    platform: {
      type: String,
      enum: ["facebook", "instagram", "linkedin", "threads", "reddit", "mastodon"],
      required: true,
    },
    postType: {
      type: String,
      enum: ["profile", "page", "group", "subreddit", "status"],
      required: true,
    },
    // Scheduling
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["post", "posted", "error", "cancelled"],
      default: "post",
    },
    // Platform-specific post ID after publishing
    platformPostId: {
      type: String,
      default: "",
    },
    // Error handling
    errorMessage: {
      type: String,
      default: "",
    },
    // Engagement tracking
    engagement: {
      // Reddit metrics
      upvotes: { type: Number, default: 0 },
      downvotes: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      upvoteRatio: { type: Number, default: 0 },
      // Mastodon metrics
      favourites: { type: Number, default: 0 },
      boosts: { type: Number, default: 0 },
      replies: { type: Number, default: 0 },
      // Facebook metrics
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      // LinkedIn metrics
      reactions: { type: Number, default: 0 },
      // Threads metrics
      threadLikes: { type: Number, default: 0 },
      threadReposts: { type: Number, default: 0 },
      // Last updated timestamp
      lastUpdated: { type: Date, default: Date.now },
    },
    // Media attachments (for platforms that support multiple media)
    mediaAttachments: [{
      url: String,
      type: String, // image, video, gif
      description: String,
      platformMediaId: String, // ID from the platform
    }],
    // Tags and categories
    tags: [{
      type: String,
    }],
    // Analytics
    publishedAt: {
      type: Date,
      default: null,
    },
    scheduledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "posts", // Explicitly set collection name
    timestamps: true, // Auto-adds `createdAt` and `updatedAt`
  }
);

// Index for better query performance
postSchema.index({ userId: 1, platform: 1, status: 1 });
postSchema.index({ date: 1, status: 1 });
postSchema.index({ platform: 1, status: 1 });

// Virtual for getting engagement summary
postSchema.virtual('engagementSummary').get(function() {
  const engagement = this.engagement;
  
  switch (this.platform) {
    case 'reddit':
      return {
        score: engagement.score,
        upvotes: engagement.upvotes,
        comments: engagement.comments,
        upvoteRatio: engagement.upvoteRatio
      };
    case 'mastodon':
      return {
        favourites: engagement.favourites,
        boosts: engagement.boosts,
        replies: engagement.replies
      };
    case 'facebook':
      return {
        likes: engagement.likes,
        shares: engagement.shares
      };
    case 'linkedin':
      return {
        reactions: engagement.reactions
      };
    case 'threads':
      return {
        likes: engagement.threadLikes,
        reposts: engagement.threadReposts
      };
    default:
      return {};
  }
});

// Method to update engagement metrics
postSchema.methods.updateEngagement = function(newMetrics) {
  this.engagement = { ...this.engagement, ...newMetrics, lastUpdated: new Date() };
  return this.save();
};

// Method to check if post is scheduled
postSchema.methods.isScheduled = function() {
  return this.status === 'post' && this.date > new Date();
};

// Method to check if post is published
postSchema.methods.isPublished = function() {
  return this.status === 'posted' && this.platformPostId;
};

// Method to check if post failed
postSchema.methods.hasFailed = function() {
  return this.status === 'error';
};

const Post = mongoose.model("Post", postSchema);

module.exports = Post;