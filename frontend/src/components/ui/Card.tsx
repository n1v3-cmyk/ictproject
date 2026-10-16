import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function Card({ children, className = '', hoverEffect = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E5E9E6] shadow-[0_2px_8px_rgba(0,0,0,0.03)] ${
        hoverEffect ? 'transition-all duration-200 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:border-[#CADACF]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-5 sm:p-6 border-b border-[#F0F2F0] ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-5 sm:p-6 bg-[#FAFAF8] border-t border-[#F0F2F0] rounded-b-2xl ${className}`}>{children}</div>;
}
