const schedule = require('node-schedule');
const Post = require('../models/PostModel');
const redditService = require('./redditService');
const mastodonService = require('./mastodonService');
const User = require('../models/User');

class SchedulerService {
  constructor() {
    this.scheduledJobs = new Map();
    this.initializeScheduler();
  }

  // Initialize scheduler and load existing scheduled posts
  async initializeScheduler() {
    try {
      console.log('Initializing scheduler...');
      
      // Load all pending posts from database
      const pendingPosts = await Post.find({ 
        status: 'post',
        date: { $gt: new Date() }
      });

      // Schedule each pending post
      for (const post of pendingPosts) {
        await this.schedulePost(post);
      }

      console.log(`Scheduled ${pendingPosts.length} pending posts`);
    } catch (error) {
      console.error('Error initializing scheduler:', error);
    }
  }

  // Schedule a post for later publication
  async schedulePost(post) {
    try {
      const jobId = `post_${post._id}`;
      
      // Cancel existing job if it exists
      if (this.scheduledJobs.has(jobId)) {
        this.scheduledJobs.get(jobId).cancel();
      }

      // Create new scheduled job
      const job = schedule.scheduleJob(post.date, async () => {
        await this.publishPost(post);
      });

      // Store job reference
      this.scheduledJobs.set(jobId, job);

      console.log(`Scheduled post ${post._id} for ${post.date}`);
      return job;
    } catch (error) {
      console.error('Error scheduling post:', error);
      throw error;
    }
  }

  // Publish a post to the appropriate platform
  async publishPost(post) {
    try {
      console.log(`Publishing post ${post._id} to ${post.platform}`);

      let result;
      
      switch (post.platform.toLowerCase()) {
        case 'reddit':
          result = await this.publishToReddit(post);
          break;
        case 'mastodon':
          result = await this.publishToMastodon(post);
          break;
        case 'facebook':
          result = await this.publishToFacebook(post);
          break;
        case 'linkedin':
          result = await this.publishToLinkedIn(post);
          break;
        case 'threads':
          result = await this.publishToThreads(post);
          break;
        default:
          throw new Error(`Unsupported platform: ${post.platform}`);
      }

      // Update post status to published
      await Post.findByIdAndUpdate(post._id, {
        status: 'posted',
        publishedAt: new Date(),
        platformPostId: result.id || result.postId
      });

      console.log(`Successfully published post ${post._id}`);
      return result;
    } catch (error) {
      console.error(`Error publishing post ${post._id}:`, error);
      
      // Update post with error status
      await Post.findByIdAndUpdate(post._id, {
        status: 'error',
        errorMessage: error.message
      });

      throw error;
    }
  }

  // Publish to Reddit
  async publishToReddit(post) {
    try {
      // Get user's Reddit credentials
      const user = await User.findById(post.userId);
      if (!user.redditAccessToken) {
        throw new Error('Reddit access token not found');
      }

      // Check if token needs refresh
      if (user.redditTokenExpiry && new Date() > user.redditTokenExpiry) {
        const refreshResult = await redditService.refreshToken(user.redditRefreshToken);
        user.redditAccessToken = refreshResult.access_token;
        user.redditTokenExpiry = new Date(Date.now() + refreshResult.expires_in * 1000);
        await user.save();
      }

      // Extract subreddit from postType or use default
      const subreddit = post.subreddit || 'test'; // Default subreddit for testing
      
      // Submit post to Reddit
      const result = await redditService.submitPost(
        user.redditAccessToken,
        subreddit,
        post.title || post.description.substring(0, 300), // Reddit title limit
        post.description,
        post.image ? 'link' : 'self'
      );

      return result;
    } catch (error) {
      console.error('Reddit publishing error:', error);
      throw error;
    }
  }

  // Publish to Mastodon
  async publishToMastodon(post) {
    try {
      // Get user's Mastodon credentials
      const user = await User.findById(post.userId);
      if (!user.mastodonAccessToken) {
        throw new Error('Mastodon access token not found');
      }

      // Upload media if present
      let mediaIds = [];
      if (post.image) {
        // Upload image to Mastodon
        const mediaResult = await mastodonService.uploadMedia(
          user.mastodonAccessToken,
          post.image,
          'image.jpg',
          post.description
        );
        mediaIds.push(mediaResult.id);
      }

      // Create post on Mastodon
      const result = await mastodonService.createPost(
        user.mastodonAccessToken,
        post.description,
        {
          visibility: post.visibility || 'public',
          mediaIds: mediaIds
        }
      );

      return result;
    } catch (error) {
      console.error('Mastodon publishing error:', error);
      throw error;
    }
  }

  // Publish to Facebook (placeholder - implement based on existing Facebook integration)
  async publishToFacebook(post) {
    try {
      // Implement Facebook publishing logic here
      // This should integrate with your existing Facebook controller
      console.log('Publishing to Facebook:', post._id);
      
      // Placeholder implementation
      return { id: `fb_${Date.now()}`, success: true };
    } catch (error) {
      console.error('Facebook publishing error:', error);
      throw error;
    }
  }

  // Publish to LinkedIn (placeholder - implement based on existing LinkedIn integration)
  async publishToLinkedIn(post) {
    try {
      // Implement LinkedIn publishing logic here
      // This should integrate with your existing LinkedIn controller
      console.log('Publishing to LinkedIn:', post._id);
      
      // Placeholder implementation
      return { id: `li_${Date.now()}`, success: true };
    } catch (error) {
      console.error('LinkedIn publishing error:', error);
      throw error;
    }
  }

  // Publish to Threads (placeholder - implement based on existing Threads integration)
  async publishToThreads(post) {
    try {
      // Implement Threads publishing logic here
      // This should integrate with your existing Threads controller
      console.log('Publishing to Threads:', post._id);
      
      // Placeholder implementation
      return { id: `th_${Date.now()}`, success: true };
    } catch (error) {
      console.error('Threads publishing error:', error);
      throw error;
    }
  }

  // Cancel a scheduled post
  async cancelScheduledPost(postId) {
    try {
      const jobId = `post_${postId}`;
      
      if (this.scheduledJobs.has(jobId)) {
        this.scheduledJobs.get(jobId).cancel();
        this.scheduledJobs.delete(jobId);
        
        // Update post status
        await Post.findByIdAndUpdate(postId, { status: 'cancelled' });
        
        console.log(`Cancelled scheduled post ${postId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error cancelling scheduled post:', error);
      throw error;
    }
  }

  // Reschedule a post
  async reschedulePost(postId, newDate) {
    try {
      // Cancel existing job
      await this.cancelScheduledPost(postId);
      
      // Update post date
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { date: newDate, status: 'post' },
        { new: true }
      );
      
      // Schedule new job
      await this.schedulePost(updatedPost);
      
      console.log(`Rescheduled post ${postId} for ${newDate}`);
      return updatedPost;
    } catch (error) {
      console.error('Error rescheduling post:', error);
      throw error;
    }
  }

  // Get all scheduled jobs
  getScheduledJobs() {
    const jobs = [];
    for (const [jobId, job] of this.scheduledJobs) {
      jobs.push({
        id: jobId,
        nextInvocation: job.nextInvocation(),
        scheduled: true
      });
    }
    return jobs;
  }

  // Clean up completed jobs
  cleanupCompletedJobs() {
    for (const [jobId, job] of this.scheduledJobs) {
      if (job.nextInvocation() === null) {
        this.scheduledJobs.delete(jobId);
      }
    }
  }
}

module.exports = new SchedulerService(); 