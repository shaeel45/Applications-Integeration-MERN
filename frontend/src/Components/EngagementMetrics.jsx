import React from 'react';

const EngagementMetrics = ({ platform, engagement, className = "" }) => {
  const getPlatformIcon = () => {
    switch (platform.toLowerCase()) {
      case 'reddit':
        return '🔴';
      case 'mastodon':
        return '🐘';
      case 'facebook':
        return '📘';
      case 'instagram':
        return '📷';
      case 'linkedin':
        return '💼';
      case 'threads':
        return '🧵';
      default:
        return '📊';
    }
  };

  const getPlatformMetrics = () => {
    switch (platform.toLowerCase()) {
      case 'reddit':
        return [
          { label: 'Upvotes', value: engagement?.upvotes || 0, icon: '⬆️' },
          { label: 'Comments', value: engagement?.comments || 0, icon: '💬' },
          { label: 'Score', value: engagement?.score || 0, icon: '📈' }
        ];
      case 'mastodon':
        return [
          { label: 'Favourites', value: engagement?.favourites || 0, icon: '⭐' },
          { label: 'Boosts', value: engagement?.boosts || 0, icon: '🔄' },
          { label: 'Replies', value: engagement?.replies || 0, icon: '💬' }
        ];
      case 'facebook':
        return [
          { label: 'Likes', value: engagement?.likes || 0, icon: '👍' },
          { label: 'Comments', value: engagement?.comments || 0, icon: '💬' },
          { label: 'Shares', value: engagement?.shares || 0, icon: '📤' }
        ];
      case 'instagram':
        return [
          { label: 'Likes', value: engagement?.likes || 0, icon: '❤️' },
          { label: 'Comments', value: engagement?.comments || 0, icon: '💬' },
          { label: 'Saves', value: engagement?.saves || 0, icon: '🔖' }
        ];
      case 'linkedin':
        return [
          { label: 'Likes', value: engagement?.likes || 0, icon: '👍' },
          { label: 'Comments', value: engagement?.comments || 0, icon: '💬' },
          { label: 'Shares', value: engagement?.shares || 0, icon: '📤' }
        ];
      case 'threads':
        return [
          { label: 'Likes', value: engagement?.likes || 0, icon: '❤️' },
          { label: 'Comments', value: engagement?.comments || 0, icon: '💬' },
          { label: 'Reposts', value: engagement?.reposts || 0, icon: '🔄' }
        ];
      default:
        return [
          { label: 'Engagement', value: engagement?.total || 0, icon: '📊' }
        ];
    }
  };

  const metrics = getPlatformMetrics();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center mb-3">
        <span className="text-2xl mr-2">{getPlatformIcon()}</span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {platform} Engagement
        </h3>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((metric, index) => (
          <div key={index} className="text-center">
            <div className="text-2xl mb-1">{metric.icon}</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {metric.value.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {metric.label}
            </div>
          </div>
        ))}
      </div>
      
      {engagement?.total && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              Total Engagement: {engagement.total.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngagementMetrics; 