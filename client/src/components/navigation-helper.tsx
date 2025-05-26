// navigation-helper.tsx
import React from 'react';
import { useLocation } from 'wouter';

// This component provides a simple way to navigate between pages
export const NavigationButton = ({ 
  destination, 
  active = false,
  children 
}: { 
  destination: string, 
  active?: boolean,
  children: React.ReactNode 
}) => {
  const [, setLocation] = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Use proper React router navigation
    setLocation(destination);
  };

  return (
    <button 
      onClick={handleClick}
      className={`no-underline bg-transparent border-0 cursor-pointer ${active ? 'text-cyan-400' : 'text-slate-400'}`}
    >
      {children}
    </button>
  );
};