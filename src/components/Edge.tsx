import React from 'react';
import type { NodePosition } from '../types';

interface EdgeProps {
  start: NodePosition;
  end: NodePosition;
  strength: number;
  type: 'topic' | 'reference' | 'quote' | 'similar';
  className?: string;
  style?: React.CSSProperties;
}

const Edge: React.FC<EdgeProps> = ({ start, end, strength, type, className, style }) => {
  const getStrokeColor = (type: EdgeProps['type']) => {
    switch(type) {
      case 'topic':
        return '#4299e1';
      case 'reference':
        return '#48bb78';
      case 'quote':
        return '#ed8936';
      case 'similar':
        return '#805ad5'; // purple for similarity
      default:
        return '#a0aec0';
    }
  };
  
  // Calculate the distance and angle between the two points
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  
  return (
    <div 
      className={className}
      style={{
        position: 'absolute',
        left: start.x,
        top: start.y,
        width: distance,
        height: Math.max(strength * 4, 2), // Ensure a minimum thickness
        backgroundColor: getStrokeColor(type),
        transformOrigin: '0 50%',
        transform: `rotate(${angle}deg)`,
        borderRadius: '4px',
        zIndex: 0,
        ...style,
      }}
    >
      <div 
        style={{
          position: 'absolute',
          top: '-12px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}
      >
        {type}
      </div>
    </div>
  );
};

export default Edge;