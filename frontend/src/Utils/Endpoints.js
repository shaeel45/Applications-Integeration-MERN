const ENDPOINTS = {
  AUTH: {
    REGISTER_USER: "signup",
    SIGN_IN: "login",
  },
  OTHER: {
    ADD_POST: "save-post",
    GET_POSTS: "posts",
    SCHEDULE_FACEBOOK_POST: "social-media/save-post",
  },
  // Reddit endpoints
  REDDIT: {
    AUTH_URL: "reddit/auth",
    CALLBACK: "reddit/callback",
    CREATE_POST: "reddit/posts",
    GET_USER_POSTS: "reddit/posts",
    GET_ENGAGEMENT: "reddit/posts/engagement",
    DELETE_POST: "reddit/posts",
    EDIT_POST: "reddit/posts",
    DISCONNECT: "reddit/disconnect",
  },
  // Mastodon endpoints
  MASTODON: {
    AUTH_URL: "mastodon/auth",
    CALLBACK: "mastodon/callback",
    CREATE_POST: "mastodon/posts",
    GET_USER_POSTS: "mastodon/posts",
    GET_ENGAGEMENT: "mastodon/posts/engagement",
    DELETE_POST: "mastodon/posts",
    EDIT_POST: "mastodon/posts",
    BOOST_POST: "mastodon/posts",
    FAVOURITE_POST: "mastodon/posts",
    DISCONNECT: "mastodon/disconnect",
  },
  // Engagement tracking
  ENGAGEMENT: {
    GET_POST_ANALYTICS: "posts/analytics",
    GET_PLATFORM_STATS: "analytics/platform",
    GET_USER_STATS: "analytics/user",
  },
  // Scheduling
  SCHEDULER: {
    GET_SCHEDULED_POSTS: "scheduler/posts",
    CANCEL_SCHEDULED_POST: "scheduler/posts",
    RESCHEDULE_POST: "scheduler/posts",
    GET_SCHEDULER_STATUS: "scheduler/status",
  },
  // Media upload
  MEDIA: {
    UPLOAD_IMAGE: "media/upload",
    DELETE_MEDIA: "media/delete",
  },
  // User management
  USER: {
    GET_PROFILE: "user/profile",
    UPDATE_PROFILE: "user/profile",
    GET_CONNECTED_PLATFORMS: "user/platforms",
    UPDATE_SETTINGS: "user/settings",
  },
};

export default ENDPOINTS;