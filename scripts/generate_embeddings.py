import json
import os
from typing import List, Dict, Any
from openai import OpenAI
import tiktoken
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def num_tokens_from_string(string: str, encoding_name: str = "cl100k_base") -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.get_encoding(encoding_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens

def get_embedding(text: str) -> List[float]:
    """Get embedding for a text using OpenAI's API."""
    # Truncate text if it's too long (max 8191 tokens for text-embedding-3-small)
    max_tokens = 8191
    tokens = num_tokens_from_string(text)
    
    if tokens > max_tokens:
        # Simple truncation - in production you might want something more sophisticated
        text = text[:int(len(text) * (max_tokens / tokens))]
    
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

def process_json_data(file_path: str) -> Dict[str, Any]:
    with open(file_path, 'r') as f:
        data = json.load(f)
    for platform in data:
        for post in data[platform]:
            post['embedding'] = get_embedding(post.get('content', ''))
    return data

def save_updated_data(data: Dict[str, Any], output_path: str):
    """Save the updated data with embeddings to a JSON file."""
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)

def main():
    input_path = '../src/data/mock_social_data.json'
    output_path = '../src/data/mock_social_data_with_embeddings.json'
    print("Processing JSON data and generating embeddings...")
    updated_data = process_json_data(input_path)
    print(f"Saving updated data to {output_path}...")
    save_updated_data(updated_data, output_path)
    print("Done!")

if __name__ == "__main__":
    main() 