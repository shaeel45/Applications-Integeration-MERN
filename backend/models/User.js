const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    // Reddit OAuth credentials
    redditAccessToken: {
      type: String,
      default: null,
    },
    redditRefreshToken: {
      type: String,
      default: null,
    },
    redditTokenExpiry: {
      type: Date,
      default: null,
    },
    redditUsername: {
      type: String,
      default: null,
    },
    redditUserId: {
      type: String,
      default: null,
    },
    // Mastodon OAuth credentials
    mastodonAccessToken: {
      type: String,
      default: null,
    },
    mastodonInstanceUrl: {
      type: String,
      default: null,
    },
    mastodonUsername: {
      type: String,
      default: null,
    },
    mastodonUserId: {
      type: String,
      default: null,
    },
    // Facebook credentials (existing)
    facebookAccessToken: {
      type: String,
      default: null,
    },
    facebookUserId: {
      type: String,
      default: null,
    },
    // LinkedIn credentials (existing)
    linkedinAccessToken: {
      type: String,
      default: null,
    },
    linkedinUserId: {
      type: String,
      default: null,
    },
    // Threads credentials (existing)
    threadsAccessToken: {
      type: String,
      default: null,
    },
    threadsUserId: {
      type: String,
      default: null,
    },
    // Account settings
    timezone: {
      type: String,
      default: 'UTC',
    },
    defaultVisibility: {
      type: String,
      enum: ['public', 'unlisted', 'private', 'direct'],
      default: 'public',
    },
    // roleId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Role", // Assumes a "Role" collection exists
    // },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt`
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Custom method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error("Password comparison error:", error);
    throw new Error("Error comparing passwords");
  }
};

// Method to check if user has connected a specific platform
userSchema.methods.hasPlatformConnected = function(platform) {
  switch (platform.toLowerCase()) {
    case 'reddit':
      return !!(this.redditAccessToken && this.redditUsername);
    case 'mastodon':
      return !!(this.mastodonAccessToken && this.mastodonUsername);
    case 'facebook':
      return !!(this.facebookAccessToken && this.facebookUserId);
    case 'linkedin':
      return !!(this.linkedinAccessToken && this.linkedinUserId);
    case 'threads':
      return !!(this.threadsAccessToken && this.threadsUserId);
    default:
      return false;
  }
};

// Method to get connected platforms
userSchema.methods.getConnectedPlatforms = function() {
  const platforms = [];
  
  if (this.hasPlatformConnected('reddit')) platforms.push('reddit');
  if (this.hasPlatformConnected('mastodon')) platforms.push('mastodon');
  if (this.hasPlatformConnected('facebook')) platforms.push('facebook');
  if (this.hasPlatformConnected('linkedin')) platforms.push('linkedin');
  if (this.hasPlatformConnected('threads')) platforms.push('threads');
  
  return platforms;
};

const User = mongoose.model("User", userSchema);

module.exports = User;