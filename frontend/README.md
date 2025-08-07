# Reach Way Frontend

A modern social media management platform built with React and Vite.

## Features

### Social Media Integrations
- **Facebook** - Post management and analytics
- **Instagram** - Content scheduling and engagement tracking
- **LinkedIn** - Professional networking posts
- **Threads** - Meta's new social platform
- **Reddit** - Community engagement and content sharing
- **Mastodon** - Decentralized social networking

### New Features (v2.0)
- **Reddit Integration**: OAuth2 authentication, post creation, engagement tracking
- **Mastodon Integration**: Multi-instance support, status posting, boost/favourite actions
- **Enhanced UI**: Dark mode support, responsive design
- **Real-time Analytics**: Engagement metrics across all platforms

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173)

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Reach Way
VITE_ENABLE_REDDIT=true
VITE_ENABLE_MASTODON=true
```

## API Integration

The frontend communicates with the backend API for:
- User authentication
- Social media platform connections
- Post creation and scheduling
- Engagement analytics
- Media uploads

## Platform-Specific Features

### Reddit
- OAuth2 authentication
- Post to subreddits
- Text and link posts
- Engagement tracking (upvotes, comments, score)

### Mastodon
- Multi-instance support
- Status posting with media
- Boost and favourite actions
- Visibility controls (public, unlisted, private)

## Components

- `PlatformConnection` - Reusable component for platform authentication
- `EngagementMetrics` - Display engagement data across platforms
- `Container` - Layout wrapper with navigation
- `SideNav` - Navigation sidebar

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Backend Requirements

Make sure the backend server is running on port 5000 with the following features:
- Reddit API integration
- Mastodon API integration
- User authentication
- Post management
- Engagement tracking