import React from 'react';
import ThreadMapper from './components/ThreadMapper';
import mockData from './data/mock_social_data_with_clusters.json';
import type { Post, Topic } from './types/index';

const App: React.FC = () => {
  // Extract twitter and reddit posts and ensure they're properly typed
  const allPosts = [...mockData.twitter, ...mockData.reddit] as Post[];
  
  // Get unique topics from all posts
  const uniqueTopics: Topic[] = Array.from(new Set(allPosts.flatMap(post => post.topics || [])))
    .map(id => ({ 
      id, 
      name: `Topic ${id}`,
      count: allPosts.filter(post => post.topics?.includes(id)).length
    }));

  return (
    <div className="App">
      <ThreadMapper 
        topics={uniqueTopics}
        posts={allPosts}
        connections={[]} // We don't need separate connections as they're in nearest_neighbors
      />
    </div>
  );
};

export default App;
