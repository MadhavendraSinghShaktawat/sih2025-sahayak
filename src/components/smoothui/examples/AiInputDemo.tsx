"use client";

import React from "react";
import { MorphSurface } from "@/components/smoothui/ui/AiInput";
import {
  SlashCommandDropdown,
  defaultCommands,
  SlashCommand,
} from "@/components/smoothui/ui/SlashCommandDropdown";
import { QuizGenerationModal } from "@/components/smoothui/ui/QuizGenerationModal";
import { SelectQuizModal } from "@/components/smoothui/ui/SelectQuizModal";

export interface AiInputDemoRef {
  openQuizGenerationModal: () => void;
}

const AiInputDemo = React.forwardRef<AiInputDemoRef, { roomId?: string }>(({ roomId }, ref) => {
  const [showSlashCommands, setShowSlashCommands] = React.useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = React.useState(0);
  const [slashPosition, setSlashPosition] = React.useState({ top: 0, left: 0 });
  const [inputValue, setInputValue] = React.useState("");
  const [cursorPosition, setCursorPosition] = React.useState(0);
  const [typedCommandName, setTypedCommandName] = React.useState<string | null>(
    null
  );
  const [isValidCommand, setIsValidCommand] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Modal state
  const [showQuizModal, setShowQuizModal] = React.useState(false);
  const [showSelectQuizModal, setShowSelectQuizModal] = React.useState(false);
  const [currentCommand, setCurrentCommand] = React.useState("");

  // Expose method to parent component
  React.useImperativeHandle(ref, () => ({
    openQuizGenerationModal: () => {
      setCurrentCommand("/quiz");
      setShowQuizModal(true);
      setInputValue(""); // Clear input when modal is opened externally
      setShowSlashCommands(false); // Hide dropdown
    },
  }));

  // Debug: React.useEffect(() => { if (showSlashCommands) console.log('Dropdown open:', slashPosition) }, [showSlashCommands, slashPosition])

  const handleSlashCommand = (command: SlashCommand) => {
    // Replace the slash command with the full command
    const beforeSlash = inputValue.substring(0, cursorPosition);
    const afterSlash = inputValue.substring(cursorPosition);

    // Find the slash position in the current text
    const slashIndex = beforeSlash.lastIndexOf("/");
    if (slashIndex !== -1) {
      // Add the command with a space for parameters
      const newValue =
        beforeSlash.substring(0, slashIndex) + `/${command.name} ` + afterSlash;
      setInputValue(newValue);
      setCursorPosition(slashIndex + command.name.length + 2);

      // Handle command-specific actions
      if (command.name === "quiz") {
        console.log(
          "Quiz command selected! Available parameters:",
          command.parameters
        );
        // TODO: Show parameter suggestions or modal
      } else if (command.name === "quizSelect") {
        console.log(
          "QuizSelect command selected! Available parameters:",
          command.parameters
        );
        // TODO: Show parameter suggestions or modal
      }
    }

    setShowSlashCommands(false);
  };

  const handleInputChange = (value: string, cursorPos: number) => {
    setInputValue(value);
    setCursorPosition(cursorPos);

    // Check if user typed '/' and show commands
    const beforeCursor = value.substring(0, cursorPos);
    const lastSlashIndex = beforeCursor.lastIndexOf("/");

    if (lastSlashIndex !== -1) {
      const afterSlash = beforeCursor.substring(lastSlashIndex + 1);
      const fullCommand = beforeCursor.substring(lastSlashIndex);

      // Extract the typed command name (e.g., "q" from "/q")
      const typedCommand = afterSlash.split(" ")[0];
      setTypedCommandName(typedCommand);

      // Check if the typed command matches any available command
      // Prioritize exact matches, then partial matches
      const exactMatch = defaultCommands.find((cmd) =>
        cmd.name.toLowerCase() === typedCommand.toLowerCase()
      );
      const partialMatch = defaultCommands.find((cmd) =>
        cmd.name.toLowerCase().startsWith(typedCommand.toLowerCase()) && 
        cmd.name.toLowerCase() !== typedCommand.toLowerCase()
      );
      
      const commandMatches = exactMatch || partialMatch;
      const isValid = !!commandMatches && typedCommand.length > 0;

      // Debug: console.log('Color highlighting:', { isValid, commandMatches, typedCommand })

      setIsValidCommand(isValid);

      // Skip parameter validation for now - will handle in modal/dialog

      // Only show dropdown if we're still typing the command (no space after slash)
      if (!afterSlash.includes(" ") && !afterSlash.includes("\n")) {
        setShowSlashCommands(true);
        setSelectedCommandIndex(0);

        // Calculate position relative to textarea - above the text but not covering it
        if (textareaRef.current) {
          const rect = textareaRef.current.getBoundingClientRect();
          const dropdownHeight = 250; // Approximate dropdown height
          const spaceAbove = rect.top;
          const spaceBelow = window.innerHeight - rect.bottom;
          
          // Position above if there's enough space, otherwise below
          const position = {
            top: spaceAbove > dropdownHeight 
              ? rect.top + window.scrollY - dropdownHeight - 10 // Above with margin
              : rect.bottom + window.scrollY + 10, // Below with margin
            left: rect.left + window.scrollX,
          };
          // Debug: console.log('Dropdown position:', position)
          setSlashPosition(position);
        }
      } else {
        setShowSlashCommands(false);
        setTypedCommandName(null);
        setIsValidCommand(false);
      }
    } else {
      setShowSlashCommands(false);
      setTypedCommandName(null);
      setIsValidCommand(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashCommands) {
      // Get filtered commands based on typed text
      const filteredCommands = defaultCommands.filter((cmd) => 
        !typedCommandName || 
        cmd.name.toLowerCase().startsWith(typedCommandName.toLowerCase())
      );
      
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedCommandIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedCommandIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedCommandIndex]) {
            handleSlashCommand(filteredCommands[selectedCommandIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setShowSlashCommands(false);
          break;
      }
    } else {
      // Check if Enter is pressed and we have a complete command
      if (e.key === "Enter" && inputValue.trim()) {
        const beforeCursor = inputValue.substring(0, cursorPosition);
        const lastSlashIndex = beforeCursor.lastIndexOf("/");

        if (lastSlashIndex !== -1) {
          const fullCommand = beforeCursor.substring(lastSlashIndex);
          const afterSlash = beforeCursor.substring(lastSlashIndex + 1);
          const typedCommand = afterSlash.split(" ")[0];

          // Check if it's a valid command
          const commandMatches = defaultCommands.some(
            (cmd) => cmd.name.toLowerCase() === typedCommand.toLowerCase()
          );

          if (commandMatches) {
            e.preventDefault();
            // Open appropriate modal based on command
            setCurrentCommand(`/${typedCommand}`);
            if (typedCommand.toLowerCase() === "quiz") {
              setShowQuizModal(true);
            } else if (typedCommand.toLowerCase() === "quizselect") {
              setShowSelectQuizModal(true);
            }
            setInputValue(""); // Clear input
          }
        }
      }
    }
  };

  const handleQuizGenerated = (quiz: any) => {
    console.log("Quiz generated successfully:", quiz);
    // TODO: Display quiz in chat or redirect to quiz view
    // For now, just log the quiz data
  };

  return (
      <div className="relative">
      <MorphSurface
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        value={inputValue}
        textareaRef={textareaRef}
        isValidCommand={isValidCommand}
      />
      
      {/* Slash Command Dropdown */}
      <SlashCommandDropdown
        isOpen={showSlashCommands}
        commands={defaultCommands}
        selectedIndex={selectedCommandIndex}
        onSelect={handleSlashCommand}
        onClose={() => setShowSlashCommands(false)}
        position={slashPosition}
        typedCommandName={typedCommandName}
      />

      {/* Quiz Generation Modal */}
      <QuizGenerationModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onQuizGenerated={handleQuizGenerated}
        command={currentCommand}
        roomId={roomId}
      />

      {/* Select Quiz Modal */}
      {showSelectQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quiz Selection</h3>
              <button
                onClick={() => setShowSelectQuizModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <p className="text-gray-600 mb-6">
                Quiz selection is available in chat rooms where you can browse and post existing quizzes to your students.
              </p>
              <button
                onClick={() => setShowSelectQuizModal(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Got it
              </button>
            </div>
          </div>
      </div>
      )}
    </div>
  );
});

AiInputDemo.displayName = "AiInputDemo";

export default AiInputDemo;
