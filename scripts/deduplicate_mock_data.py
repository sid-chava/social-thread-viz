import json
from collections import defaultdict

INPUT_PATH = '../src/data/mockDataFinal.json'
OUTPUT_PATH = '../src/data/mockDataDeduped.json'

# Load the data
with open(INPUT_PATH, 'r') as f:
    data = json.load(f)

def deduplicate(posts):
    seen_ids = set()
    seen_content = set()
    deduped = []
    for post in posts:
        post_id = post.get('id')
        content = post.get('content')
        if post_id in seen_ids or content in seen_content:
            continue
        seen_ids.add(post_id)
        seen_content.add(content)
        deduped.append(post)
    return deduped

# Deduplicate each platform
for key in ['tweetData', 'redditData', 'tiktokData']:
    if key in data:
        data[key] = deduplicate(data[key])

# Save the deduplicated data
with open(OUTPUT_PATH, 'w') as f:
    json.dump(data, f, indent=2)

print(f"Deduplicated data saved to {OUTPUT_PATH}") 