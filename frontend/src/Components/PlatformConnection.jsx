import React, { useState } from 'react';
import { redditApiService } from '../api/redditApi';
import { mastodonApiService } from '../api/mastodonApi';

const PlatformConnection = ({ platform, onConnectionChange }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [instanceUrl, setInstanceUrl] = useState('');
  const [showInstanceInput, setShowInstanceInput] = useState(false);

  const handleConnect = async () => {
    if (platform === 'Mastodon' && !instanceUrl) {
      setShowInstanceInput(true);
      return;
    }

    setIsConnecting(true);
    try {
      let authUrl;
      
      if (platform === 'Reddit') {
        const response = await redditApiService.getAuthUrl();
        authUrl = response.authUrl;
      } else if (platform === 'Mastodon') {
        const response = await mastodonApiService.getAuthUrl(instanceUrl);
        authUrl = response.authUrl;
      }

      if (authUrl) {
        // Store platform info for callback handling
        localStorage.setItem('connectingPlatform', platform);
        if (platform === 'Mastodon') {
          localStorage.setItem('mastodonInstanceUrl', instanceUrl);
        }
        
        // Redirect to OAuth URL
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error(`Error connecting to ${platform}:`, error);
      alert(`Failed to connect to ${platform}. Please try again.`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const userId = localStorage.getItem('userId'); // Get from your auth system
      
      if (platform === 'Reddit') {
        await redditApiService.disconnectAccount(userId);
      } else if (platform === 'Mastodon') {
        await mastodonApiService.disconnectAccount(userId);
      }
      
      setIsConnected(false);
      onConnectionChange && onConnectionChange(platform, false);
      alert(`${platform} account disconnected successfully!`);
    } catch (error) {
      console.error(`Error disconnecting from ${platform}:`, error);
      alert(`Failed to disconnect from ${platform}. Please try again.`);
    }
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case 'Reddit':
        return '🔴';
      case 'Mastodon':
        return '🐘';
      default:
        return '🔗';
    }
  };

  const getPlatformDescription = () => {
    switch (platform) {
      case 'Reddit':
        return 'Connect your Reddit account to post and manage content';
      case 'Mastodon':
        return 'Connect your Mastodon account to post and manage content';
      default:
        return 'Connect your social media account';
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="text-4xl mb-4">{getPlatformIcon()}</div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {platform}
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
        {getPlatformDescription()}
      </p>

      {platform === 'Mastodon' && showInstanceInput && (
        <div className="w-full mb-4">
          <input
            type="text"
            placeholder="Enter your Mastodon instance URL (e.g., https://mastodon.social)"
            value={instanceUrl}
            onChange={(e) => setInstanceUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Enter the URL of your Mastodon instance
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 
                     text-white rounded-md transition-colors duration-200"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md 
                     transition-colors duration-200"
          >
            Disconnect
          </button>
        )}
      </div>

      {isConnected && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-md">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✓ {platform} account connected successfully!
          </p>
        </div>
      )}
    </div>
  );
};

export default PlatformConnection; 