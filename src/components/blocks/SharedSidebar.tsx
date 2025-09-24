'use client';

import { 
  Home, 
  Users, 
  BarChart3, 
  Settings, 
  PlusCircle, 
  FileText, 
  Calendar,
  LogOut,
  Menu,
  PanelLeftClose,
  Award,
  Clock,
  Search,
  List,
  TrendingUp,
  Activity,
  User,
  Bell,
  Book,
  Link,
  Trophy,
  CheckSquare
} from 'lucide-react';
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Icon mapping for dynamic icon rendering
const iconMap: Record<string, React.ComponentType<any>> = {
  Home,
  Users,
  BarChart3,
  Settings,
  PlusCircle,
  FileText,
  Calendar,
  LogOut,
  Menu,
  PanelLeftClose,
  Award,
  Clock,
  Search,
  List,
  TrendingUp,
  Activity,
  User,
  Bell,
  Book,
  Link,
  Trophy,
  CheckSquare
};

interface SidebarItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: string;
}

interface PanelContent {
  type: string;
  title: string;
  description: string;
  items: SidebarItem[];
}

interface SidebarSection {
  id: string;
  label: string;
  icon: string;
  panelContent: PanelContent;
}

interface SidebarConfig {
  role: string;
  sections: SidebarSection[];
  logout: {
    label: string;
    icon: string;
    action: string;
  };
}

interface SharedSidebarProps {
  config: SidebarConfig;
  onAction?: (action: string, data?: any) => void;
}

const SidebarToggle = ({
  isOpen,
  setIsOpen,
  config
}: {
  isOpen: string | false;
  setIsOpen: (isOpen: string | false) => void;
  config: SidebarConfig;
}) => {
  const renderIcon = () => {
    switch (isOpen !== false) {
      case true:
        return <PanelLeftClose size={20} />;
      case false:
        return <Menu size={20} />;
    }
  };
  return (
    <li
      onClick={() => {
        if (isOpen) {
          setIsOpen(false);
        } else {
          setIsOpen(config.sections[0]?.id || 'dashboard');
        }
      }}
      className="flex items-center justify-center cursor-pointer hover:bg-blue-800/50 mx-3 my-2 py-3 rounded-lg transition-colors"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          initial={{ opacity: 0.3, scale: 0.5, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0.3, scale: 0.5, filter: 'blur(4px)' }}
          key={`sidebar-toggle-${isOpen ? true : false}`}
          className="text-white"
        >
          {renderIcon()}
        </motion.span>
      </AnimatePresence>
    </li>
  );
};

const PanelContentRenderer = ({ content, onAction }: { content: PanelContent; onAction?: (action: string, data?: any) => void }) => {
  return (
    <div className="w-full h-full bg-white p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{content.title}</h3>
        <p className="text-sm text-gray-600">{content.description}</p>
      </div>

      <div className="space-y-3">
        {content.items.map((item) => {
          const IconComponent = iconMap[item.icon] || FileText;
          return (
            <div 
              key={item.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-colors"
              onClick={() => onAction?.(item.action, item)}
            >
              <div className="flex items-center gap-3 mb-2">
                <IconComponent className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">{item.label}</h4>
              </div>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Quick Actions
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Recent Activity</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Quick Stats</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SharedSidebar = ({ config, onAction }: SharedSidebarProps) => {
  const [isOpen, setIsOpen] = useState<string | false>(false);
  const [hovering, setHovering] = useState<string | null>(null);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleAction = (action: string, data?: any) => {
    if (action === 'logout') {
      handleLogout();
    } else {
      onAction?.(action, data);
    }
  };

  const getSidebarColor = () => {
    return config.role === 'teacher' ? 'bg-blue-900 border-blue-800' : 'bg-green-900 border-green-800';
  };

  const getActiveColor = () => {
    return config.role === 'teacher' ? 'bg-blue-800 text-blue-200' : 'bg-green-800 text-green-200';
  };

  const getHoverColor = () => {
    return config.role === 'teacher' ? 'hover:bg-blue-800' : 'hover:bg-green-800';
  };

  return (
    <div className="h-screen flex items-start">
      <ul className={`h-full w-20 ${getSidebarColor()} flex flex-col border-r`}>
        <SidebarToggle isOpen={isOpen} setIsOpen={setIsOpen} config={config} />
        <div className="flex-1 flex flex-col">
          {config.sections.map((section) => {
            const isActive = isOpen === section.id;
            const IconComponent = iconMap[section.icon] || Home;

            return (
              <li
                key={section.id}
                onMouseEnter={() => {
                  if (!isOpen) setHovering(section.id);
                }}
                onMouseLeave={(e) => {
                  if (!isOpen) {
                    setHovering(null);
                  }
                }}
                onClick={() => {
                  setIsOpen(section.id);
                }}
                className="group flex flex-col items-center justify-center cursor-pointer select-none"
              >
                <div
                  className={cn(
                    `flex flex-col items-center justify-center gap-1 ${getHoverColor()} p-3 rounded-lg text-white/90 transition-colors`,
                    isActive && getActiveColor()
                  )}
                >
                  <IconComponent size={20} />
                  <p className="text-xs font-medium">{section.label}</p>
                </div>
              </li>
            );
          })}
        </div>
        <li
          onClick={() => handleAction(config.logout.action)}
          className="group flex flex-col items-center justify-center cursor-pointer select-none mb-4"
        >
          <div className={`flex flex-col items-center justify-center gap-1 group-hover:bg-red-800/50 p-3 rounded-lg text-white/90 transition-colors`}>
            <LogOut size={20} />
            <p className="text-xs font-medium">{config.logout.label}</p>
          </div>
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
              {(isOpen || hovering) && (
                <PanelContentRenderer 
                  content={config.sections.find((s) => s.id === (isOpen || hovering))?.panelContent!} 
                  onAction={handleAction}
                />
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SharedSidebar;
