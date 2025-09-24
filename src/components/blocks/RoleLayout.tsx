'use client';

import React from 'react';
import SharedSidebar from './SharedSidebar';
import teacherConfig from '@/config/sidebar-teacher.json';
import studentConfig from '@/config/sidebar-student.json';

interface RoleLayoutProps {
  role: 'teacher' | 'student';
  children: React.ReactNode;
  onAction?: (action: string, data?: any) => void;
}

const RoleLayout = ({ role, children, onAction }: RoleLayoutProps) => {
  const config = role === 'teacher' ? teacherConfig : studentConfig;

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <SharedSidebar config={config} onAction={onAction} />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default RoleLayout;
