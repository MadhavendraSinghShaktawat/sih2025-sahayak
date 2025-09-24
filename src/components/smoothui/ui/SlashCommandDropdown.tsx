"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils/cn";

export interface SlashCommand {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  parameters?: string[];
}

interface SlashCommandDropdownProps {
  isOpen: boolean;
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  position: { top: number; left: number };
  typedCommandName?: string | null;
}

export const SlashCommandDropdown: React.FC<SlashCommandDropdownProps> = ({
  isOpen,
  commands,
  selectedIndex,
  onSelect,
  onClose,
  position,
  typedCommandName,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Get filtered commands based on typed text
      const filteredCommands = commands.filter((cmd) => 
        !typedCommandName || 
        cmd.name.toLowerCase().startsWith(typedCommandName.toLowerCase())
      );

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "Enter":
          if (selectedIndex >= 0 && selectedIndex < filteredCommands.length) {
            onSelect(filteredCommands[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, commands, onSelect, onClose, typedCommandName]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed z-50 min-w-[280px] max-w-[320px] rounded-xl border border-gray-200 bg-white shadow-xl backdrop-blur-sm"
          style={{
            top: position.top,
            left: position.left,
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">
              Commands
            </div>
            <div className="space-y-1">
              {(() => {
                const filteredCommands = commands.filter((command) => 
                  !typedCommandName || 
                  command.name.toLowerCase().startsWith(typedCommandName.toLowerCase())
                );
                return filteredCommands.map((command, index) => (
                <motion.button
                  key={command.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                    "hover:bg-blue-50 hover:shadow-sm focus:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200",
                    // Selected command (primary highlight)
                    selectedIndex === index &&
                      "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
                  )}
                  onClick={() => onSelect(command)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {command.icon && (
                    <div
                      className={cn(
                        "flex-shrink-0 w-5 h-5 transition-colors",
                        selectedIndex === index
                          ? "text-blue-600"
                          : "text-gray-400"
                      )}
                    >
                      {command.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "font-semibold text-sm transition-colors",
                        selectedIndex === index
                          ? "text-blue-700"
                          : "text-gray-900"
                      )}
                    >
                      {command.name}
                    </div>
                    <div
                      className={cn(
                        "text-xs transition-colors",
                        selectedIndex === index
                          ? "text-blue-600"
                          : "text-gray-500"
                      )}
                    >
                      {command.description}
                    </div>
                    {command.parameters && command.parameters.length > 0 && (
                      <div className="text-xs text-gray-400 mt-1 font-mono">
                        {command.parameters.join(" • ")}
                      </div>
                    )}
                  </div>
                </motion.button>
                ));
              })()}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-400 px-2">
                <span>↑↓ to navigate</span>
                <span>Enter to select</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Default commands for quiz generation
export const defaultCommands: SlashCommand[] = [
  {
    id: "quiz",
    name: "quiz",
    description: "Generate a quiz from content",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    parameters: ["topic", "class", "language", "difficulty", "type"],
  },
  {
    id: "quizSelect",
    name: "quizSelect",
    description: "Select and post an existing quiz",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
    ),
    parameters: ["search", "filter"],
  },
];

export default SlashCommandDropdown;
