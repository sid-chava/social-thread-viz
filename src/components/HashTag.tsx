import React from 'react';

interface HashTagProps {
  name: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

const HashTag: React.FC<HashTagProps> = ({ name, count, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-blue-100 text-blue-800 border-blue-300 border'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 border'
    }`}
  >
    #{name} <span className="text-xs ml-1">({count})</span>
  </button>
);

export default HashTag;