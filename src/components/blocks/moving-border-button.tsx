"use client"

import { cn } from '@/lib/utils';
import React, { useState } from 'react';

const MovingBorderButton = ({
  children,
  wrapperClassName,
  className,
  onClick,
  type = 'button'
}: {
  children?: React.ReactNode;
  wrapperClassName?: string;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={cn(`rounded-full overflow-hidden relative p-[2px]`, wrapperClassName)}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      type={type}
    >
      <span
        className={cn(
          // soft blue animated border
          'absolute transition-all inset-[-200%] animate-[spin_2.5s_linear_infinite] bg-[conic-gradient(from_90deg,transparent_30%,#93c5fd_100%)] blur-md',
          isHovered && 'bg-[conic-gradient(from_90deg,transparent_30%,#60a5fa_100%)] '
        )}
      />
      <span
        className={cn(
          // light inner surface
          `bg-white text-gray-900 transition-all hover:bg-blue-50 rounded-full px-4 py-2 flex items-center justify-center relative border border-gray-200 shadow-sm`,
          className
        )}
      >
        {children}
      </span>
    </button>
  );
};

export default MovingBorderButton;
