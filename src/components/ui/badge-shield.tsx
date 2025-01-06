import React from 'react';

interface BadgeShieldProps {
  type: 'FREE' | 'FREEMIUM' | 'PAID';
  className?: string;
}

const BadgeShield = ({ type, className = '' }: BadgeShieldProps) => {
  const getColor = () => {
    switch (type) {
      case 'FREE':
        return '#4B6BFB';
      case 'FREEMIUM':
        return '#FFB800';
      case 'PAID':
        return '#F1592A';
    }
  };

  const text = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  const color = getColor();
  const width = text.length * 10 + 20; // Adjust width based on text length

  return (
    <svg
      width={width}
      height="24"
      viewBox={`0 0 ${width} 24`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d={`M0 2C0 0.895431 0.895431 0 2 0H${width - 4}L${width} 12L${width - 4} 24H2C0.895431 24 0 23.1046 0 22V2Z`}
        fill={color}
      />
      <path
        d={`M${width / 2 - 15} 0H${width - 4}L${width} 12L${width - 4} 24H${width / 2 - 15}L${width / 2 - 10} 12L${width / 2 - 15} 0Z`}
        fill="white"
        fillOpacity="0.2"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontWeight="600"
        fontFamily="system-ui"
      >
        {text}
      </text>
    </svg>
  );
};

export default BadgeShield; 