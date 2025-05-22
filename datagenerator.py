import os
import json
import random
from dotenv import load_dotenv
import requests
import time
import re

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

# Define diverse themes for Andor posts
ANDOR_THEMES = [
    "prison arc and rebellion themes",
    "Luthen Rael's character and monologues",
    "Empire's bureaucracy and surveillance",
    "Cassian's character development",
    "Ferrix community and culture",
    "Maarva and rebellion leadership",
    "ISB and Imperial politics",
    "Aldhani heist planning and execution",
    "Narkina 5 prison escape",
    "Mon Mothma's political struggles",
    "Syril Karn's obsession",
    "Dedra Meero's rise in ISB",
    "Nemik's manifesto",
    "Saw Gerrera's extremism",
    "comparison to other Star Wars shows"
]

# Define different post types for variety
TWITTER_TYPES = [
    "reaction to episode",
    "character analysis",
    "show critique",
    "theory/speculation",
    "favorite scene discussion",
    "comparison to other media",
    "behind the scenes fact",
    "quote appreciation",
    "rewatch observation",
    "production detail"
]

REDDIT_TYPES = [
    "detailed analysis",
    "episode discussion",
    "character study",
    "theory crafting",
    "appreciation post",
    "cinematography analysis",
    "political themes discussion",
    "show comparison",
    "symbolism analysis",
    "production detail discussion"
]

def call_gemini(prompt):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    headers = {
        "Content-Type": "application/json"
    }
    params = {
        "key": API_KEY
    }
    data = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 1024,
        }
    }
    response = requests.post(url, headers=headers, params=params, json=data)
    response.raise_for_status()
    try:
        return response.json()["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        print(f"Error parsing Gemini response: {e}")
        print("Response:", response.json())
        raise

def extract_json(text):
    # Remove triple backticks and optional 'json' after them
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        return match.group(1)
    # Fallback: try to find the first { ... }
    match = re.search(r"(\{.*\})", text, re.DOTALL)
    if match:
        return match.group(1)
    return text  # as is, if nothing else

def generate_twitter_post(idx):
    theme = random.choice(ANDOR_THEMES)
    post_type = random.choice(TWITTER_TYPES)
    
    prompt = (
        f"Generate a JSON object for a detailed, specific Twitter post about the Star Wars show Andor. "
        f"Focus on {theme} with a {post_type} style. "
        f"Make it feel authentic and include specific details from the show. "
        f"Schema: {{id: str, platform: 'twitter', user: str, content: str, likes: int, retweets: int, timestamp: ISO8601 str, topics: [int]}}. "
        f"Use id 't{idx}'. The content should be Twitter-appropriate length but meaningful. "
        f"Vary the engagement metrics realistically. "
        f"Only output a valid JSON object, with no explanation or extra text."
    )
    return call_gemini(prompt)

def generate_reddit_post(idx):
    theme = random.choice(ANDOR_THEMES)
    post_type = random.choice(REDDIT_TYPES)
    
    prompt = (
        f"Generate a JSON object for a thoughtful Reddit post about the Star Wars show Andor. "
        f"Focus on {theme} with a {post_type} style. "
        f"Make it feel like an authentic Reddit discussion with specific show details. "
        f"Schema: {{id: str, platform: 'reddit', subreddit: str, user: str, title: str, content: str, upvotes: int, comments: int, timestamp: ISO8601 str, topics: [int]}}. "
        f"Use id 'r{idx}'. The title should be engaging and the content should be detailed and analytical. "
        f"Vary the engagement metrics realistically. "
        f"Only output a valid JSON object, with no explanation or extra text."
    )
    return call_gemini(prompt)

def main():
    twitter_posts = []
    reddit_posts = []
    
    # Generate more posts for better variety
    for i in range(1, 51):  # Increased from 25 to 50
        print(f"Generating Twitter post {i}")
        tw = generate_twitter_post(i)
        print("Gemini response:", tw)
        try:
            twitter_posts.append(json.loads(extract_json(tw)))
        except json.JSONDecodeError as e:
            print(f"Error decoding Twitter post {i}: {e}")
            continue
        time.sleep(1)

        print(f"Generating Reddit post {i}")
        rd = generate_reddit_post(i)
        print("Gemini response:", rd)
        try:
            reddit_posts.append(json.loads(extract_json(rd)))
        except json.JSONDecodeError as e:
            print(f"Error decoding Reddit post {i}: {e}")
            continue
        time.sleep(1)

    # Save the data
    with open("mock_social_data.json", "w") as f:
        json.dump({"twitter": twitter_posts, "reddit": reddit_posts}, f, indent=2)

    # Also save as a text file for easy copy-paste into MockData.ts
    with open("mock_social_data.txt", "w") as f:
        f.write("export const tweetData = ")
        f.write(json.dumps(twitter_posts, indent=2))
        f.write(";\n\n")
        f.write("export const redditData = ")
        f.write(json.dumps(reddit_posts, indent=2))
        f.write(";\n")

if __name__ == "__main__":
    main() 