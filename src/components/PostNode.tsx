import React from 'react';
import type { Post } from '../types';

interface PostNodeProps {
  platform: Post['platform'];
  title?: string;
  user: string;
  content: string;
  isSelected: boolean;
  onClick: () => void;
  metrics?: {
    likes?: number;
    retweets?: number;
    upvotes?: number;
    comments?: number;
  };
}

const PostNode: React.FC<PostNodeProps> = ({ 
  platform, 
  title, 
  user, 
  content, 
  isSelected, 
  onClick,
  metrics
}) => {
  const platformColors = {
    twitter: '#1DA1F2',
    reddit: '#FF4500'
  };
  
  const iconMap = {
    twitter: '🐦',
    reddit: '🔴'
  };

  const getMetricsDisplay = () => {
    if (platform === 'twitter' && metrics?.likes !== undefined && metrics?.retweets !== undefined) {
      return `❤️ ${metrics.likes} 🔄 ${metrics.retweets}`;
    } else if (platform === 'reddit' && metrics?.upvotes !== undefined && metrics?.comments !== undefined) {
      return `⬆️ ${metrics.upvotes} 💬 ${metrics.comments}`;
    }
    return '';
  };

  // Clamp title to 1 line, show tooltip if truncated
  const renderTitle = () => {
    if (platform === 'reddit' && title) {
      return (
        <div
          className="font-bold truncate max-w-[180px]"
          title={title}
        >
          {title}
        </div>
      );
    }
    return <div className="font-bold truncate max-w-[120px]" title={user}>{user}</div>;
  };

  return (
    <div 
      className={`px-4 py-3 shadow-md rounded-md border cursor-pointer transition-all ${isSelected ? 'scale-105 shadow-lg' : ''}`}
      style={{
        borderColor: platformColors[platform],
        backgroundColor: isSelected ? '#f0f9ff' : 'white',
        borderWidth: isSelected ? '2px' : '1px',
        maxWidth: 300,
        minWidth: 250
      }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-2">{iconMap[platform]}</div>
          {renderTitle()}
        </div>
        <div
          className="text-xs text-gray-500 truncate max-w-[80px]"
          title={platform === 'reddit' ? user : undefined}
        >
          {platform === 'reddit' ? user : ''}
        </div>
      </div>
      <div className="text-sm mt-2 line-clamp-2">
        {content}
      </div>
      {metrics && (
        <div className="text-xs text-gray-500 mt-2">
          {getMetricsDisplay()}
        </div>
      )}
    </div>
  );
};

export default PostNode;