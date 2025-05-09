import React from 'react';

interface DefaultBlogImageProps {
  title: string;
  type: 'payment' | 'security' | 'business' | 'experience' | 'technology';
  className?: string;
}

const getColors = (type: string): { primary: string; secondary: string; icon: JSX.Element } => {
  switch (type) {
    case 'payment':
      return {
        primary: '#4F46E5',
        secondary: '#C7D2FE',
        icon: (
          <path 
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.008v.008H12V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      };
    case 'security':
      return {
        primary: '#047857',
        secondary: '#A7F3D0',
        icon: (
          <path 
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      };
    case 'business':
      return {
        primary: '#0E7490',
        secondary: '#A5F3FC',
        icon: (
          <path 
            d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      };
    case 'experience':
      return {
        primary: '#7E22CE',
        secondary: '#E9D5FF',
        icon: (
          <path 
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      };
    case 'technology':
    default:
      return {
        primary: '#0F766E',
        secondary: '#99F6E4',
        icon: (
          <path 
            d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      };
  }
};

export default function DefaultBlogImage({ title, type, className = '' }: DefaultBlogImageProps) {
  const { primary, secondary, icon } = getColors(type);
  const initials = title
    .split(' ')
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <svg 
      className={`w-full h-full ${className}`} 
      viewBox="0 0 300 200" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="300" height="200" fill={secondary} rx="8" />
      
      {/* Center Icon */}
      <g transform="translate(125, 70)">
        <circle cx="25" cy="25" r="25" fill={primary} />
        <g transform="translate(13, 13)" stroke={secondary} strokeWidth="2" fill="none">
          {icon}
        </g>
      </g>
      
      {/* Title Text */}
      <text
        x="150"
        y="145"
        fontFamily="system-ui, sans-serif"
        fontSize="16"
        fontWeight="bold"
        textAnchor="middle"
        fill={primary}
      >
        {initials}
      </text>

      {/* CPXTB Text */}
      <text
        x="150"
        y="165"
        fontFamily="system-ui, sans-serif"
        fontSize="12"
        textAnchor="middle"
        fill={primary}
      >
        CPXTB Payment Platform
      </text>
    </svg>
  );
}