export function toUpper(input: string): string {
  return input.toUpperCase();
}

export function toEnvironmentVariable(input: string): string {
  const envVariable = input.replace(/[\\$'"]+/g, "").replace(" ", "_");
  return envVariable.toUpperCase();
}

/**
 * Detects if the selected text is an environment variable reference
 * and extracts the variable name from various patterns
 */
export interface EnvVarDetectionResult {
  isEnvVarReference: boolean;
  variableName?: string;
  pattern?: string;
  valueToReplace?: string;
}

export function detectEnvVarReference(text: string): EnvVarDetectionResult {
  // Trim whitespace for better detection
  const trimmedText = text.trim();

  // Pattern 1: process.env.VAR_NAME (Node.js)
  const nodejsMatch = trimmedText.match(/^process\.env\.([A-Z_][A-Z0-9_]*)$/);
  if (nodejsMatch) {
    return {
      isEnvVarReference: true,
      variableName: nodejsMatch[1],
      pattern: "nodejs",
      valueToReplace: trimmedText
    };
  }

  // Pattern 2: ${VAR_NAME} (Shell/Bash/env expansion)
  const shellBracesMatch = trimmedText.match(/^\$\{([A-Z_][A-Z0-9_]*)\}$/);
  if (shellBracesMatch) {
    return {
      isEnvVarReference: true,
      variableName: shellBracesMatch[1],
      pattern: "shell-braces",
      valueToReplace: trimmedText
    };
  }

  // Pattern 3: $VAR_NAME (Shell/Bash)
  const shellMatch = trimmedText.match(/^\$([A-Z_][A-Z0-9_]*)$/);
  if (shellMatch) {
    return {
      isEnvVarReference: true,
      variableName: shellMatch[1],
      pattern: "shell",
      valueToReplace: trimmedText
    };
  }

  // Pattern 4: import.meta.env.VAR_NAME (Vite)
  const viteMatch = trimmedText.match(/^import\.meta\.env\.([A-Z_][A-Z0-9_]*)$/);
  if (viteMatch) {
    return {
      isEnvVarReference: true,
      variableName: viteMatch[1],
      pattern: "vite",
      valueToReplace: trimmedText
    };
  }

  // Pattern 5: %VAR_NAME% (Windows)
  const windowsMatch = trimmedText.match(/^%([A-Z_][A-Z0-9_]*)%$/);
  if (windowsMatch) {
    return {
      isEnvVarReference: true,
      variableName: windowsMatch[1],
      pattern: "windows",
      valueToReplace: trimmedText
    };
  }

  // Pattern 6: os.environ['VAR_NAME'] or os.environ["VAR_NAME"] (Python)
  const pythonEnvironMatch = trimmedText.match(/^os\.environ\[['"]([A-Z_][A-Z0-9_]*)['"]?\]$/);
  if (pythonEnvironMatch) {
    return {
      isEnvVarReference: true,
      variableName: pythonEnvironMatch[1],
      pattern: "python-environ",
      valueToReplace: trimmedText
    };
  }

  // Pattern 7: os.getenv('VAR_NAME') or os.getenv("VAR_NAME") (Python)
  const pythonGetenvMatch = trimmedText.match(/^os\.getenv\(['"]([A-Z_][A-Z0-9_]*)['"]?\)$/);
  if (pythonGetenvMatch) {
    return {
      isEnvVarReference: true,
      variableName: pythonGetenvMatch[1],
      pattern: "python-getenv",
      valueToReplace: trimmedText
    };
  }

  // Pattern 8: ENV['VAR_NAME'] or ENV["VAR_NAME"] (Ruby)
  const rubyMatch = trimmedText.match(/^ENV\[['"]([A-Z_][A-Z0-9_]*)['"]?\]$/);
  if (rubyMatch) {
    return {
      isEnvVarReference: true,
      variableName: rubyMatch[1],
      pattern: "ruby",
      valueToReplace: trimmedText
    };
  }

  // Not an environment variable reference
  return {
    isEnvVarReference: false
  };
}

/**
 * Suggests the appropriate environment variable format based on file type/language
 * Uses user configuration from settings, with built-in defaults as fallback
 */
export function suggestEnvVarFormat(variableName: string, languageId?: string, formatConfig?: Record<string, string>): string {
  if (!languageId) {
    // Default to just the variable name
    return variableName;
  }

  // Built-in default formats (fallback if user hasn't configured)
  const defaultFormats: Record<string, string> = {
    "javascript": "process.env.${VAR_NAME}",
    "typescript": "process.env.${VAR_NAME}",
    "javascriptreact": "process.env.${VAR_NAME}",
    "typescriptreact": "process.env.${VAR_NAME}",
    "powershell": "$env:${VAR_NAME}",
    "shellscript": "$${VAR_NAME}",
    "bash": "$${VAR_NAME}",
    "sh": "$${VAR_NAME}",
    "python": "os.getenv('${VAR_NAME}')",
    "ruby": "ENV['${VAR_NAME}']",
    "go": "os.Getenv(\"${VAR_NAME}\")",
    "rust": "env::var(\"${VAR_NAME}\")",
    "php": "$_ENV['${VAR_NAME}']",
    "java": "System.getenv(\"${VAR_NAME}\")",
    "csharp": "Environment.GetEnvironmentVariable(\"${VAR_NAME}\")",
    "vue": "import.meta.env.${VAR_NAME}",
    "dockerfile": "$${VAR_NAME}",
    "yaml": "${{ secrets.${VAR_NAME} }}",
    "yml": "${{ secrets.${VAR_NAME} }}",
    "bat": "%${VAR_NAME}%",
    "cmd": "%${VAR_NAME}%"
  };

  // Merge user config with defaults so partial overrides preserve other defaults
  const formats = formatConfig ? { ...defaultFormats, ...formatConfig } : defaultFormats;

  // Get the format template for this language
  const template = formats[languageId];

  if (!template) {
    // No format defined for this language, return just the variable name
    return variableName;
  }

  // Replace ${VAR_NAME} placeholder with the actual variable name
  return template.replace(/\$\{VAR_NAME\}/g, variableName);
}
