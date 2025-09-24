'use client';

import { 
  BookOpen, 
  Users, 
  BarChart3, 
  Settings, 
  Video, 
  FileText, 
  Calendar,
  LogOut,
  Home,
  Menu,
  PanelLeftClose,
  Award,
  Clock
} from 'lucide-react';
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const LearningChildren = ({ pass, setPass, handleComplete, joining }: any) => {
  return (
    <div className="w-full h-full bg-blue-50 p-6">
      <div className="mb-8">
        <div className="h-6 bg-blue-600 rounded w-28 animate-pulse mb-2"></div>
        <div className="h-4 bg-blue-700 rounded w-40 animate-pulse"></div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5 text-blue-600" />
            <div className="h-4 bg-blue-600 rounded w-24 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-blue-500 rounded w-full animate-pulse"></div>
            <div className="h-3 bg-blue-500 rounded w-3/4 animate-pulse"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-5 h-5 text-green-600" />
            <div className="h-4 bg-green-600 rounded w-28 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-green-500 rounded w-full animate-pulse"></div>
            <div className="h-3 bg-green-500 rounded w-2/3 animate-pulse"></div>
          </div>
        </div>
      </div>

      <div>
        <div className="h-4 bg-blue-700 rounded w-20 animate-pulse mb-3"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 hover:bg-blue-100 rounded">
            <div className="h-3 bg-blue-500 rounded-full w-3 animate-pulse"></div>
            <div className="h-3 bg-blue-500 rounded w-32 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3 p-2 hover:bg-blue-100 rounded">
            <div className="h-3 bg-blue-500 rounded-full w-3 animate-pulse"></div>
            <div className="h-3 bg-blue-500 rounded w-28 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MaterialsChildren = () => {
  return (
    <div className="w-full h-full bg-green-50 p-6">
      <div className="mb-8">
        <div className="h-6 bg-green-600 rounded w-24 animate-pulse mb-2"></div>
        <div className="h-4 bg-green-700 rounded w-36 animate-pulse"></div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
          <div className="h-4 bg-green-500 rounded-full w-4 animate-pulse"></div>
          <div className="h-4 bg-green-500 rounded w-24 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
          <div className="h-4 bg-green-500 rounded-full w-4 animate-pulse"></div>
          <div className="h-4 bg-green-500 rounded w-20 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
          <div className="h-4 bg-green-500 rounded-full w-4 animate-pulse"></div>
          <div className="h-4 bg-green-500 rounded w-32 animate-pulse"></div>
        </div>
      </div>

      <div>
        <div className="h-4 bg-green-700 rounded w-32 animate-pulse mb-3"></div>
        <div className="space-y-2">
          <div className="h-16 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg animate-pulse"></div>
          <div className="h-16 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

const ProgressChildren = () => {
  return (
    <div className="w-full h-full bg-purple-50 p-6">
      <div className="mb-8">
        <div className="h-6 bg-purple-600 rounded w-28 animate-pulse mb-2"></div>
        <div className="h-4 bg-purple-700 rounded w-40 animate-pulse"></div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-6 border border-purple-200">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-purple-500 rounded w-20 animate-pulse"></div>
          <div className="h-4 bg-purple-500 rounded w-16 animate-pulse"></div>
        </div>
        <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
          <div className="bg-purple-500 h-2 rounded-full w-3/4 animate-pulse"></div>
        </div>
        <div className="h-3 bg-purple-500 rounded w-24 animate-pulse"></div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200">
          <div className="h-4 bg-purple-500 rounded w-4 animate-pulse"></div>
          <div className="h-4 bg-purple-500 rounded w-20 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200">
          <div className="h-4 bg-purple-500 rounded w-4 animate-pulse"></div>
          <div className="h-4 bg-purple-500 rounded w-24 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

const ScheduleChildren = () => {
  return (
    <div className="w-full h-full bg-orange-50 p-6">
      <div className="mb-8">
        <div className="h-6 bg-orange-600 rounded w-24 animate-pulse mb-2"></div>
        <div className="h-4 bg-orange-700 rounded w-36 animate-pulse"></div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="bg-white rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <div className="h-4 bg-orange-500 rounded w-20 animate-pulse"></div>
          </div>
          <div className="h-3 bg-orange-500 rounded w-full animate-pulse"></div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-4 h-4 text-orange-600" />
            <div className="h-4 bg-orange-500 rounded w-24 animate-pulse"></div>
          </div>
          <div className="h-3 bg-orange-500 rounded w-full animate-pulse"></div>
        </div>
      </div>

      <div>
        <div className="h-4 bg-orange-700 rounded w-28 animate-pulse mb-3"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 hover:bg-orange-100 rounded">
            <div className="h-3 bg-orange-500 rounded-full w-3 animate-pulse"></div>
            <div className="h-3 bg-orange-500 rounded w-32 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3 p-2 hover:bg-orange-100 rounded">
            <div className="h-3 bg-orange-500 rounded-full w-3 animate-pulse"></div>
            <div className="h-3 bg-orange-500 rounded w-28 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarToggle = ({
  isOpen,
  setIsOpen
}: {
  isOpen: string | false;
  setIsOpen: (isOpen: string | false) => void;
}) => {
  const renderIcon = () => {
    switch (isOpen !== false) {
      case true:
        return <PanelLeftClose size={24} />;
      case false:
        return <Menu size={24} />;
    }
  };
  return (
    <li
      onClick={() => {
        if (isOpen) {
          setIsOpen(false);
        } else {
          setIsOpen('Learning');
        }
      }}
      className="flex flex-col items-center justify-center gap-1 mb-2 cursor-pointer hover:bg-green-800 my-3 py-2.5 mx-4 rounded-md m-1.5"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          initial={{ opacity: 0.3, scale: 0.5, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0.3, scale: 0.5, filter: 'blur(4px)' }}
          key={`sidebar-toggle-${isOpen ? true : false}`}
        >
          {renderIcon()}
        </motion.span>
      </AnimatePresence>
    </li>
  );
};

const StudentSidebar = ({ pass, setPass, handleComplete, joining }: any) => {
  const [isOpen, setIsOpen] = useState<string | false>(false);
  const [hovering, setHovering] = useState<string | null>(null);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const options = [
    {
      name: 'Learning',
      icon: <Home size={24} />,
      children: <LearningChildren 
        pass={pass}
        setPass={setPass}
        handleComplete={handleComplete}
        joining={joining}
      />
    },
    {
      name: 'Materials',
      icon: <BookOpen size={24} />,
      children: <MaterialsChildren />
    },
    {
      name: 'Progress',
      icon: <Award size={24} />,
      children: <ProgressChildren />
    },
    {
      name: 'Schedule',
      icon: <Calendar size={24} />,
      children: <ScheduleChildren />
    },
    {
      name: 'Settings',
      icon: <Settings size={24} />,
      children: <div className="w-full h-full bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Settings Panel</p>
          <p className="text-sm text-gray-400">Coming soon...</p>
        </div>
      </div>
    }
  ];

  return (
    <div className="h-full flex items-start">
      <ul className="h-full w-20 bg-green-900 flex flex-col gap-1 border-r border-green-800">
        <SidebarToggle isOpen={isOpen} setIsOpen={setIsOpen} />
        {options.map((option) => {
          const isActive = isOpen === option.name;

          return (
            <li
              key={option.name}
              onMouseEnter={() => {
                if (!isOpen) setHovering(option.name);
              }}
              onMouseLeave={(e) => {
                if (!isOpen) {
                  setHovering(null);
                }
              }}
              onClick={() => {
                setIsOpen(option.name);
              }}
              className="group px-1.5 gap-1 py-1 flex flex-col items-center justify-center cursor-pointer select-none"
            >
              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-1 group-hover:bg-green-800 p-2.5 rounded-md text-white/90',
                  isActive && 'bg-green-800 text-green-200'
                )}
              >
                {option.icon}
              </div>
              <p className="text-xs">{option.name}</p>
            </li>
          );
        })}
        <li
          onClick={handleLogout}
          className="group px-1.5 gap-1 py-1 flex flex-col items-center justify-center cursor-pointer select-none mt-auto mb-4"
        >
          <div className="flex flex-col items-center justify-center gap-1 group-hover:bg-red-800 p-2.5 rounded-md text-white/90">
            <LogOut size={24} />
          </div>
          <p className="text-xs">Logout</p>
        </li>
      </ul>
      <AnimatePresence mode="popLayout" initial={false}>
        {(hovering || isOpen) && (
          <motion.section
            id="sidebar-children"
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            animate={{ clipPath: 'inset(0 0 0 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)', transition: { delay: 0.06 } }}
            transition={{
              duration: 0.2,
              type: 'spring',
              bounce: 0
            }}
            onMouseEnter={() => {
              if (!isOpen) setHovering(isOpen || hovering);
            }}
            onMouseLeave={() => {
              if (!isOpen) setHovering(null);
            }}
            key={isOpen ? isOpen : hovering}
            className="h-full bg-white border-r border-gray-200"
          >
            <div className="w-[300px] h-full">
              {(isOpen || hovering) &&
                options.find((opt) => opt.name === (isOpen || hovering))?.children}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentSidebar;
