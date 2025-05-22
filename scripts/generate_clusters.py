import json
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import normalize
from sklearn.metrics.pairwise import cosine_similarity
import matplotlib.pyplot as plt
from typing import Dict, List, Any
from heapq import nlargest

def load_data(file_path: str) -> Dict[str, List[Dict[str, Any]]]:
    """Load data from the JSON file."""
    with open(file_path, 'r') as f:
        return json.load(f)

def prepare_data(data: Dict[str, List[Dict[str, Any]]]) -> tuple:
    """Prepare data for clustering and keep track of post metadata."""
    all_posts = []
    all_embeddings = []
    
    # Combine all posts from different platforms
    for platform in ['twitter', 'reddit']:
        for post in data[platform]:
            # Create a simple embedding based on topics and content
            # This is a simplified version - in production you'd use a proper embedding model
            embedding = np.zeros(200)  # Using 200 dimensions for simplicity
            
            # Add topic information
            if 'topics' in post:
                for topic in post['topics']:
                    embedding[topic % 200] += 1
            
            # Add content information (simple word frequency)
            words = post['content'].lower().split()
            for word in words:
                # Simple hash function to map words to embedding dimensions
                word_hash = hash(word) % 200
                embedding[word_hash] += 1
            
            all_posts.append(post)
            all_embeddings.append(embedding)
    
    # Convert to numpy array and normalize
    embeddings_array = np.array(all_embeddings)
    normalized_embeddings = normalize(embeddings_array)
    
    return all_posts, normalized_embeddings

def find_nearest_neighbors(embeddings: np.ndarray, posts: List[Dict[str, Any]], n_neighbors: int = 5) -> List[List[Dict[str, Any]]]:
    """Find n nearest neighbors for each post based on cosine similarity."""
    similarity_matrix = cosine_similarity(embeddings)
    neighbors_list = []
    for i in range(len(posts)):
        similarities = similarity_matrix[i]
        similarities[i] = -1
        neighbor_indices = np.argsort(similarities)[-n_neighbors:][::-1]
        neighbors = [
            {
                'id': posts[idx]['id'],
                'similarity': float(similarities[idx])
            }
            for idx in neighbor_indices
        ]
        neighbors_list.append(neighbors)
    return neighbors_list

def perform_clustering(embeddings: np.ndarray, n_clusters: int = 5) -> np.ndarray:
    """Perform K-means clustering on the embeddings."""
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    return kmeans.fit_predict(embeddings)

def analyze_clusters(posts: List[Dict[str, Any]], labels: np.ndarray) -> Dict[str, Any]:
    """Analyze the clusters and return statistics."""
    cluster_stats = {}
    
    for i in range(max(labels) + 1):
        cluster_posts = [post for post, label in zip(posts, labels) if label == i]
        cluster_stats[f'cluster_{i}'] = {
            'size': len(cluster_posts),
            'platforms': {
                'twitter': len([p for p in cluster_posts if p['platform'] == 'twitter']),
                'reddit': len([p for p in cluster_posts if p['platform'] == 'reddit'])
            },
            'sample_posts': [p['content'][:100] + '...' for p in cluster_posts[:3]]  # First 3 posts as samples
        }
    
    return cluster_stats

def save_clustered_data(data: Dict[str, List[Dict[str, Any]]], labels: np.ndarray, neighbors_list: List[List[Dict[str, Any]]], output_path: str):
    """Save the data with cluster assignments and nearest neighbors."""
    # Add cluster assignments and nearest neighbors to each post
    post_idx = 0
    for platform in ['twitter', 'reddit']:
        for post in data[platform]:
            post['cluster'] = int(labels[post_idx])
            post['nearest_neighbors'] = neighbors_list[post_idx]
            post_idx += 1
    
    # Save to JSON
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)

def plot_cluster_distribution(labels: np.ndarray, output_path: str):
    """Plot the distribution of posts across clusters."""
    plt.figure(figsize=(10, 6))
    plt.hist(labels, bins=len(set(labels)), edgecolor='black')
    plt.title('Distribution of Posts Across Clusters')
    plt.xlabel('Cluster')
    plt.ylabel('Number of Posts')
    plt.savefig(output_path)
    plt.close()

def main():
    # Paths
    input_path = '../src/data/mock_social_data.json'
    output_path = '../src/data/mock_social_data_with_clusters.json'
    plot_path = '../src/data/cluster_distribution.png'
    
    # Load data
    print("Loading data...")
    data = load_data(input_path)
    
    # Prepare data for clustering
    print("Preparing data for clustering...")
    posts, embeddings = prepare_data(data)
    
    # Find nearest neighbors
    print("Finding nearest neighbors for each post...")
    neighbors_list = find_nearest_neighbors(embeddings, posts)
    
    # Perform clustering
    print("Performing clustering...")
    labels = perform_clustering(embeddings)
    
    # Analyze clusters
    print("Analyzing clusters...")
    cluster_stats = analyze_clusters(posts, labels)
    
    # Print cluster statistics
    print("\nCluster Statistics:")
    for cluster_id, stats in cluster_stats.items():
        print(f"\n{cluster_id}:")
        print(f"Size: {stats['size']}")
        print("Platform distribution:")
        for platform, count in stats['platforms'].items():
            print(f"  {platform}: {count}")
        print("Sample posts:")
        for post in stats['sample_posts']:
            print(f"  - {post}")
    
    # Save clustered data with nearest neighbors
    print(f"\nSaving clustered data to {output_path}...")
    save_clustered_data(data, labels, neighbors_list, output_path)
    
    # Plot cluster distribution
    print(f"Saving cluster distribution plot to {plot_path}...")
    plot_cluster_distribution(labels, plot_path)
    
    print("Done!")

if __name__ == "__main__":
    main() 