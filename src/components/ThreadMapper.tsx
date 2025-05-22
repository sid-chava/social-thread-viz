import React, { useState, useEffect, useRef } from 'react';
import type { Post, TwitterPost, RedditPost, Topic, Connection, NodePosition } from '../types';
import HashTag from './HashTag';
import PostNode from './PostNode';
import Edge from './Edge';
import './ThreadMapper.css';

interface ThreadMapperProps {
  topics: Topic[];
  posts: Post[];
  connections: Connection[];
}

const ThreadMapper: React.FC<ThreadMapperProps> = ({ topics, posts, connections }) => {
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const [visibleEdges, setVisibleEdges] = useState<{ key: string; start: NodePosition; end: NodePosition; fadingOut?: boolean }[]>([]);
  const fadeDuration = 400;
  
  // Find the most liked tweet
  const getMostLikedTweet = () => {
    return posts
      .filter((post): post is TwitterPost => post.platform === 'twitter')
      .reduce((max, post) => post.likes > (max?.likes || 0) ? post : max);
  };

  // Generate star pattern positions for a given center post
  const generateStarPositions = (centerPost: Post | null) => {
    const positions: Record<string, NodePosition> = {};
    const width = window.innerWidth * 0.8;
    const height = window.innerHeight * 0.7;
    const centerX = width / 2;
    const centerY = height / 2;
    if (!centerPost) return positions;

    // Get all posts to show (center, neighbors, neighbors' neighbors)
    const postsToShow = getDisplayPostsFor(centerPost);
    positions[centerPost.id] = { x: centerX, y: centerY };

    // Direct neighbors
    const neighbors = centerPost.nearest_neighbors || [];
    const radius = 300;
    neighbors.forEach((neighbor, index) => {
      const angle = (index / neighbors.length) * 2 * Math.PI;
      positions[neighbor.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });

    // Second-degree neighbors (spread them in a larger ring)
    const secondDegree: string[] = [];
    neighbors.forEach((neighbor) => {
      const neighborPost = posts.find(p => p.id === neighbor.id);
      if (neighborPost && neighborPost.nearest_neighbors) {
        neighborPost.nearest_neighbors.forEach(nn => {
          if (
            nn.id !== centerPost.id &&
            !positions[nn.id] &&
            !secondDegree.includes(nn.id)
          ) {
            secondDegree.push(nn.id);
          }
        });
      }
    });
    const secondRadius = 500;
    secondDegree.forEach((id, index) => {
      const angle = (index / secondDegree.length) * 2 * Math.PI;
      positions[id] = {
        x: centerX + secondRadius * Math.cos(angle),
        y: centerY + secondRadius * Math.sin(angle)
      };
    });

    return positions;
  };

  // Helper to get display posts for any center post
  const getDisplayPostsFor = (centerPost: Post) => {
    const idSet = new Set<string>();
    const postsToShow: Post[] = [];
    idSet.add(centerPost.id);
    postsToShow.push(centerPost);
    const neighbors = centerPost.nearest_neighbors || [];
    neighbors.forEach(n => {
      if (!idSet.has(n.id)) {
        const neighborPost = posts.find(p => p.id === n.id);
        if (neighborPost) {
          idSet.add(neighborPost.id);
          postsToShow.push(neighborPost);
        }
      }
    });
    neighbors.forEach(n => {
      const neighborPost = posts.find(p => p.id === n.id);
      if (neighborPost && neighborPost.nearest_neighbors) {
        neighborPost.nearest_neighbors.forEach(nn => {
          if (!idSet.has(nn.id)) {
            const nnPost = posts.find(p => p.id === nn.id);
            if (nnPost) {
              idSet.add(nnPost.id);
              postsToShow.push(nnPost);
            }
          }
        });
      }
    });
    return postsToShow;
  };

  // Update node positions whenever selectedPost changes
  useEffect(() => {
    const centerPost = selectedPost
      ? posts.find(p => p.id === selectedPost)
      : getMostLikedTweet();
    setNodePositions(generateStarPositions(centerPost || null));
  }, [selectedPost, posts]);

  // Update selected post on initial load
  useEffect(() => {
    const mostLikedTweet = getMostLikedTweet();
    if (mostLikedTweet) {
      setSelectedPost(mostLikedTweet.id);
      setShowDetail(true);
    }
  }, [posts]);

  // Use the new helper for display posts
  const getDisplayPosts = () => {
    const centerPost = selectedPost
      ? posts.find(p => p.id === selectedPost)
      : getMostLikedTweet();
    if (!centerPost) return [];
    return getDisplayPostsFor(centerPost);
  };

  useEffect(() => {
    if (selectedPost && nodePositions[selectedPost] && graphRef.current) {
      const { x, y } = nodePositions[selectedPost];
      const rect = graphRef.current.getBoundingClientRect();
      const viewCenterX = rect.width / 2;
      const viewCenterY = rect.height / 2;
      setPan({
        x: viewCenterX - x * zoom,
        y: viewCenterY - y * zoom,
      });
    }
  }, [selectedPost, nodePositions, zoom]);
  
  const handlePostClick = (postId: string) => {
    setSelectedPost(postId === selectedPost ? null : postId);
    setShowDetail(postId !== selectedPost);
  };
  
  const handleTopicClick = (topicId: number) => {
    setSelectedTopic(topicId === selectedTopic ? null : topicId);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
  };

  // Get active topic name
  const activeTopic = selectedTopic !== null 
    ? topics.find(t => t.id === selectedTopic) 
    : null;
  
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStart) return;
    setPan(pan => ({
      x: pan.x + (e.clientX - dragStart.x) / zoom,
      y: pan.y + (e.clientY - dragStart.y) / zoom,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 0.1 : -0.1;
    zoomToViewCenter(zoomDelta);
  };

  const zoomToViewCenter = (zoomDelta: number) => {
    if (!graphRef.current) return;
    const rect = graphRef.current.getBoundingClientRect();
    const viewCenterX = rect.width / 2;
    const viewCenterY = rect.height / 2;

    setZoom(prevZoom => {
      setPan(prevPan => {
        const newZoom = Math.max(0.2, Math.min(2, prevZoom + zoomDelta));
        const wx = (viewCenterX - prevPan.x) / prevZoom;
        const wy = (viewCenterY - prevPan.y) / prevZoom;
        const newPanX = viewCenterX - wx * newZoom;
        const newPanY = viewCenterY - wy * newZoom;
        return { x: newPanX, y: newPanY };
      });
      return Math.max(0.2, Math.min(2, prevZoom + zoomDelta));
    });
  };

  const centerGraph = () => {
    if (!graphRef.current) return;
    const rect = graphRef.current.getBoundingClientRect();
    const viewCenterX = rect.width / 2;
    const viewCenterY = rect.height / 2;
    setPan({ x: viewCenterX, y: viewCenterY });
  };

  const getPostMetrics = (post: Post) => {
    if (post.platform === 'twitter') {
      return {
        likes: post.likes,
        retweets: post.retweets
      };
    } else if (post.platform === 'reddit') {
      return {
        upvotes: post.upvotes,
        comments: post.comments
      };
    }
    return undefined;
  };

  const computeEdges = () => {
    const edges: { key: string; start: NodePosition; end: NodePosition }[] = [];
    getDisplayPosts().forEach((post) => {
      if (!post.nearest_neighbors) return;
      post.nearest_neighbors.forEach((neighbor) => {
        const start = nodePositions[post.id];
        const end = nodePositions[neighbor.id];
        if (!start || !end) return;
        edges.push({ key: `${post.id}-${neighbor.id}`, start, end });
      });
    });
    return edges;
  };

  useEffect(() => {
    const newEdges = computeEdges();
    const newKeys = new Set(newEdges.map(e => e.key));
    const oldKeys = new Set(visibleEdges.map(e => e.key));

    // Edges to fade out
    const fadingOut = visibleEdges
      .filter(e => !newKeys.has(e.key))
      .map(e => ({ ...e, fadingOut: true }));
    // Edges to keep or fade in
    const stayingOrIn = newEdges.map(e => ({ ...e, fadingOut: false }));

    setVisibleEdges([...stayingOrIn, ...fadingOut]);

    // Remove faded out edges after animation
    if (fadingOut.length > 0) {
      const timeout = setTimeout(() => {
        setVisibleEdges(current => current.filter(e => !e.fadingOut));
      }, fadeDuration);
      return () => clearTimeout(timeout);
    }
  }, [nodePositions]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-slate-900 text-white p-3 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Andor Episode Reactions</h1>
          <p className="text-sm text-gray-300">Most popular reactions and their connections</p>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        <div
          ref={graphRef}
          className="w-full h-full relative"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.2s',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
        >
          {/* Render edges with fade animation */}
          {visibleEdges.map(edge => (
            <Edge
              key={edge.key}
              start={edge.start}
              end={edge.end}
              strength={1}
              type="similar"
              className={`edge-fade ${edge.fadingOut ? 'fade-out' : 'fade-in'}`}
              style={{ transition: `opacity ${fadeDuration}ms` }}
            />
          ))}
          
          {/* Render the nodes */}
          {getDisplayPosts().map((post) => {
            if (!post) return null;
            const title = post.platform === 'reddit' ? (post as RedditPost).title : undefined;
            
            return (
              <div 
                key={post.id}
                style={{
                  position: 'absolute',
                  left: nodePositions[post.id]?.x || 0,
                  top: nodePositions[post.id]?.y || 0,
                  transform: 'translate(-50%, -50%)',
                  zIndex: selectedPost === post.id ? 10 : 1
                }}
                onPointerDown={e => e.stopPropagation()}
              >
                <PostNode
                  platform={post.platform}
                  title={title}
                  user={post.user}
                  content={post.content}
                  isSelected={selectedPost === post.id}
                  onClick={() => handlePostClick(post.id)}
                  metrics={getPostMetrics(post)}
                />
              </div>
            );
          })}
        </div>
        
        {/* Network Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex bg-white rounded-full shadow-md p-1 z-10">
          <button
            className="mx-1 p-2 text-gray-700 rounded-full hover:bg-gray-100"
            onClick={() => zoomToViewCenter(0.1)}
          >
            <span role="img" aria-label="Zoom In">🔍+</span>
          </button>
          <button
            className="mx-1 p-2 text-gray-700 rounded-full hover:bg-gray-100"
            onClick={() => zoomToViewCenter(-0.1)}
          >
            <span role="img" aria-label="Zoom Out">🔍-</span>
          </button>
          <button
            className="mx-1 p-2 text-gray-700 rounded-full hover:bg-gray-100"
            onClick={centerGraph}
          >
            <span role="img" aria-label="Center">⌖</span>
          </button>
        </div>
        
        {/* Detail Panel */}
        <div 
          className={`absolute top-0 right-0 bottom-0 w-96 bg-white shadow-lg border-l transition-transform duration-300 transform z-20 ${
            showDetail ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {selectedPost && (
            <div className="h-full overflow-auto">
              <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
                <h2 className="text-lg font-bold">Post Details</h2>
                <button 
                  className="text-gray-400 hover:text-gray-600 text-xl"
                  onClick={handleCloseDetail}
                >
                  ×
                </button>
              </div>
              
              <div className="p-4">
                {(() => {
                  const post = posts.find(p => p.id === selectedPost);
                  if (!post) return null;
                  
                  const platformColors = {
                    twitter: '#1DA1F2',
                    reddit: '#FF4500'
                  };
                  
                  return (
                    <div className="border rounded-lg p-4 shadow-sm" style={{ borderColor: platformColors[post.platform] }}>
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-2">
                          {post.platform === 'twitter' ? '🐦' : '🔴'}
                        </span>
                        <div>
                          {post.platform === 'twitter' && (
                            <div className="font-bold">@{post.user}</div>
                          )}
                          {post.platform === 'reddit' && (
                            <>
                              <div className="font-bold">{(post as RedditPost).subreddit}</div>
                              <div className="text-sm text-gray-500">Posted by u/{post.user}</div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {post.platform === 'reddit' && (
                        <h3 className="font-bold text-lg mb-2">{(post as RedditPost).title}</h3>
                      )}
                      
                      <p className="mb-4">{post.content}</p>
                      
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>
                          {post.platform === 'twitter' 
                            ? `${(post as TwitterPost).likes} likes · ${(post as TwitterPost).retweets} retweets` 
                            : `${(post as RedditPost).upvotes} upvotes · ${(post as RedditPost).comments} comments`}
                        </span>
                        <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                      </div>
                      
                      {/* Similar Posts */}
                      {post.nearest_neighbors && post.nearest_neighbors.length > 0 && (
                        <div className="mt-4 pt-3 border-t">
                          <h4 className="font-medium mb-2">Similar Posts</h4>
                          <div className="space-y-2">
                            {post.nearest_neighbors.map((neighbor, idx) => {
                              const neighborPost = posts.find(p => p.id === neighbor.id);
                              if (!neighborPost) return null;
                              
                              return (
                                <div 
                                  key={idx}
                                  className="p-2 border rounded cursor-pointer hover:bg-gray-50 text-sm"
                                  onClick={() => handlePostClick(neighbor.id)}
                                >
                                  <div className="flex items-center mb-1">
                                    <span className="mr-1">
                                      {neighborPost.platform === 'twitter' ? '🐦' : '🔴'}
                                    </span>
                                    <span className="font-medium">
                                      {neighborPost.platform === 'reddit' 
                                        ? (neighborPost as RedditPost).title 
                                        : `@${neighborPost.user}`
                                      }
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 mb-1 truncate">{neighborPost.content}</p>
                                  <div className="text-xs text-gray-500">
                                    Similarity: {(neighbor.similarity * 100).toFixed(1)}%
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Status bar */}
      <div className="bg-white p-2 border-t text-xs text-gray-500 flex justify-between items-center">
        <div>
          Showing {getDisplayPosts().length} posts
        </div>
        <div>
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default ThreadMapper;