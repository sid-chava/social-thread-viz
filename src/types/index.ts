export interface Topic {
    id: number;
    name: string;
    count?: number;
  }
  
  export interface BasePost {
    id: string;
    platform: 'twitter' | 'reddit';
    content: string;
    timestamp: string;
    topics?: number[];
    cluster?: number;
    nearest_neighbors?: {
      id: string;
      platform: 'twitter' | 'reddit';
      content: string;
      similarity: number;
    }[];
  }
  
  export interface TwitterPost extends BasePost {
    platform: 'twitter';
    user: string;
    likes: number;
    retweets: number;
  }
  
  export interface RedditPost extends BasePost {
    platform: 'reddit';
    subreddit: string;
    user: string;
    title: string;
    upvotes: number;
    comments: number;
  }
  
  export type Post = TwitterPost | RedditPost;
  
  export interface Connection {
    source: string;
    target: string;
    strength: number;
    type: 'similar' | 'reply' | 'quote';
  }
  
  export interface NodePosition {
    x: number;
    y: number;
  }