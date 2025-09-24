export interface ParsedCommand {
  command: string;
  parameters: Record<string, string>;
  isValid: boolean;
  errors: string[];
}

export function parseSlashCommand(input: string): ParsedCommand {
  const result: ParsedCommand = {
    command: "",
    parameters: {},
    isValid: true,
    errors: [],
  };

  // Extract command and parameters from input like "/quiz topic:maths class:6"
  const match = input.match(/^\/(\w+)(?:\s+(.+))?$/);

  if (!match) {
    result.isValid = false;
    result.errors.push("Invalid command format");
    return result;
  }

  result.command = match[1];

  // Parse parameters if they exist
  if (match[2]) {
    const paramString = match[2];
    const paramPairs = paramString.split(/\s+/);

    for (const pair of paramPairs) {
      const colonIndex = pair.indexOf(":");
      if (colonIndex === -1) {
        result.errors.push(`Invalid parameter format: ${pair}`);
        result.isValid = false;
        continue;
      }

      const key = pair.substring(0, colonIndex).trim();
      const value = pair.substring(colonIndex + 1).trim();

      if (!key || !value) {
        result.errors.push(`Empty parameter key or value: ${pair}`);
        result.isValid = false;
        continue;
      }

      result.parameters[key] = value;
    }
  }

  return result;
}

export function validateQuizCommand(parsed: ParsedCommand): ParsedCommand {
  const validParams = ["topic", "class", "language", "difficulty", "type"];
  const validTypes = ["mcq", "t-f", "fillups", "mixup"];
  const validDifficulties = ["easy", "medium", "hard"];
  const validLanguages = ["english", "hindi", "spanish", "french", "german"];

  // Check for invalid parameters
  for (const param of Object.keys(parsed.parameters)) {
    if (!validParams.includes(param)) {
      parsed.errors.push(
        `Invalid parameter: ${param}. Valid parameters are: ${validParams.join(", ")}`
      );
      parsed.isValid = false;
    }
  }

  // Validate specific parameter values
  if (parsed.parameters.type && !validTypes.includes(parsed.parameters.type)) {
    parsed.errors.push(
      `Invalid type: ${parsed.parameters.type}. Valid types are: ${validTypes.join(", ")}`
    );
    parsed.isValid = false;
  }

  if (
    parsed.parameters.difficulty &&
    !validDifficulties.includes(parsed.parameters.difficulty)
  ) {
    parsed.errors.push(
      `Invalid difficulty: ${parsed.parameters.difficulty}. Valid difficulties are: ${validDifficulties.join(", ")}`
    );
    parsed.isValid = false;
  }

  if (
    parsed.parameters.language &&
    !validLanguages.includes(parsed.parameters.language)
  ) {
    parsed.errors.push(
      `Invalid language: ${parsed.parameters.language}. Valid languages are: ${validLanguages.join(", ")}`
    );
    parsed.isValid = false;
  }

  // Validate class parameter (should be a number or grade level)
  if (parsed.parameters.class) {
    const classValue = parsed.parameters.class.toLowerCase();
    const validClasses = [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "kg",
      "nursery",
    ];
    if (!validClasses.includes(classValue)) {
      parsed.errors.push(
        `Invalid class: ${parsed.parameters.class}. Valid classes are: ${validClasses.join(", ")}`
      );
      parsed.isValid = false;
    }
  }

  return parsed;
}

export function formatCommandSuggestion(
  command: string,
  parameters: Record<string, string>
): string {
  const paramString = Object.entries(parameters)
    .map(([key, value]) => `${key}:${value}`)
    .join(" ");

  return `/${command}${paramString ? " " + paramString : ""}`;
}
