# Social Thread Visualization

A React-based visualization tool for social media threads, built with TypeScript and Vite. This project provides an interactive way to visualize and analyze social media conversations, with features for clustering and embedding analysis.

## Features

- Interactive thread visualization
- Post clustering based on content similarity
- Embedding analysis for semantic understanding
- Real-time data processing
- Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Data Processing**: Python scripts for data generation and analysis
- **Visualization**: Custom React components for thread mapping

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sid-chava/social-thread-viz.git
cd social-thread-viz
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install Python dependencies:
```bash
cd scripts
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your configuration values.

### Development

1. Start the development server:
```bash
npm run dev
```

2. Generate mock data (if needed):
```bash
python scripts/deduplicate_mock_data.py
python scripts/generate_embeddings.py
python scripts/generate_clusters.py
```

## Project Structure

```
social-thread-viz/
├── src/
│   ├── components/     # React components
│   ├── data/          # Mock data and processed data
│   ├── types/         # TypeScript type definitions
│   └── assets/        # Static assets
├── scripts/           # Python data processing scripts
├── public/           # Public assets
└── ...
```

## Data Processing

The project includes several Python scripts for data processing:

- `deduplicate_mock_data.py`: Removes duplicate entries from mock data
- `generate_embeddings.py`: Creates embeddings for text analysis
- `generate_clusters.py`: Groups similar posts into clusters

