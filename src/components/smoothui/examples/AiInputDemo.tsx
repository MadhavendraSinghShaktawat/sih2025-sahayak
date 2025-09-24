"use client";

import React from "react";
import { MorphSurface } from "@/components/smoothui/ui/AiInput";
import {
  SlashCommandDropdown,
  defaultCommands,
  SlashCommand,
} from "@/components/smoothui/ui/SlashCommandDropdown";
import { QuizGenerationModal } from "@/components/smoothui/ui/QuizGenerationModal";

export default function AiInputDemo() {
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
  const [currentCommand, setCurrentCommand] = React.useState("");

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

      // Show parameter suggestions for quiz command
      if (command.name === "quiz") {
        console.log(
          "Quiz command selected! Available parameters:",
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
      // Only highlight if we're still typing the command (no space after the command)
      const commandMatches = defaultCommands.some((cmd) =>
        cmd.name.toLowerCase().startsWith(typedCommand.toLowerCase())
      );

      // Keep command highlighted as long as it's a valid command, even with parameters
      const isValid = commandMatches && typedCommand.length > 0;

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
          const position = {
            top: rect.top + window.scrollY - 200, // Higher up so it doesn't cover the text
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
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedCommandIndex((prev) =>
            prev < defaultCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedCommandIndex((prev) =>
            prev > 0 ? prev - 1 : defaultCommands.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          handleSlashCommand(defaultCommands[selectedCommandIndex]);
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
            // Open modal with just the command name (no parameters)
            setCurrentCommand(`/${typedCommand}`);
            setShowQuizModal(true);
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
    <div className="flex flex-col items-center space-y-8">
      {/* Main Demo */}
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
      </div>

      {/* Quiz Generation Modal */}
      <QuizGenerationModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onQuizGenerated={handleQuizGenerated}
        command={currentCommand}
      />
    </div>
  );
}
