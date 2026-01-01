import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { Logger } from "./logger";

/**
 * Parses an env file and extracts all variable names and their values
 */
export function parseEnvFile(content: string): Map<string, string> {
  const variables = new Map<string, string>();
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    // Match KEY=VALUE pattern
    const match = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      variables.set(key, value);
    }
  }

  return variables;
}

/**
 * Gets the configuration for sync functionality
 */
export function getSyncConfig() {
  const config = vscode.workspace.getConfiguration("envmanager");
  // Default is empty object (sync disabled by default)
  const mappings = config.get<Record<string, string[]> | null>("syncMappings", {});

  return {
    // Sync is enabled if mappings is not null and not an empty object
    enabled: mappings !== null && Object.keys(mappings).length > 0,
    mappings: mappings || {},
    placeholder: config.get<string>("exampleFilePlaceholder", "<your-value-here>"),
  };
}

/**
 * Determines if a file is an env file (not an example/template file)
 */
export function isActualEnvFile(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  return (
    (lowerName === ".env" || lowerName.startsWith(".env.")) &&
    !lowerName.includes("example") &&
    !lowerName.includes("sample") &&
    !lowerName.includes("template") &&
    !lowerName.includes("dist")
  );
}

/**
 * Gets the corresponding example files for a given .env file based on mappings
 */
export async function getExampleFilesForEnv(envFilePath: string): Promise<vscode.Uri[]> {
  const config = getSyncConfig();
  const dirPath = path.dirname(envFilePath);
  const fileName = path.basename(envFilePath);
  const exampleFiles: vscode.Uri[] = [];

  // Get exact match from mappings
  const exampleFileNames = config.mappings[fileName];

  // If no match, return empty array
  if (!exampleFileNames || exampleFileNames.length === 0) {
    return exampleFiles;
  }

  // Create URIs for each example file
  for (const exampleFileName of exampleFileNames) {
    const examplePath = path.join(dirPath, exampleFileName);
    const exampleUri = vscode.Uri.file(examplePath);
    exampleFiles.push(exampleUri);
  }

  return exampleFiles;
}

/**
 * Syncs variables from a .env file to an example file
 */
export async function syncEnvToExample(
  envFilePath: string,
  exampleFilePath: string,
  placeholder: string
): Promise<{ added: string[]; updated: string[]; removed: string[]; unchanged: number }> {
  // Read source env file
  const envContent = await fs.readFile(envFilePath, "utf-8");
  const envLines = envContent.split(/\r?\n/);

  // Read existing example file if it exists
  let existingExampleVars = new Map<string, string>();
  try {
    const exampleContent = await fs.readFile(exampleFilePath, "utf-8");
    const existingVars = parseEnvFile(exampleContent);
    existingExampleVars = existingVars;
  } catch (error) {
    // Example file doesn't exist, that's fine
  }

  const added: string[] = [];
  const updated: string[] = [];
  const removed: string[] = [];
  let unchanged = 0;

  // Build new example content by processing the source env file line by line
  const newLines: string[] = [];

  for (const line of envLines) {
    const trimmed = line.trim();

    // Preserve comments and empty lines as-is
    if (!trimmed || trimmed.startsWith("#")) {
      newLines.push(line);
      continue;
    }

    // Check if this line is a variable
    const match = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
    if (match) {
      const varName = match[1];

      if (existingExampleVars.has(varName)) {
        // Variable already exists in example
        const existingValue = existingExampleVars.get(varName);
        if (existingValue === placeholder) {
          // Value is already the placeholder, unchanged
          unchanged++;
        } else {
          // Value needs to be updated to placeholder
          updated.push(varName);
        }
        existingExampleVars.delete(varName);
      } else {
        // New variable
        added.push(varName);
      }

      newLines.push(`${varName}=${placeholder}`);
    } else {
      // Not a recognized pattern, keep as-is
      newLines.push(line);
    }
  }

  // Any variables left in existingExampleVars were removed from the source
  removed.push(...existingExampleVars.keys());

  // Write the updated example file
  const newContent = newLines.join(os.EOL);

  // Ensure newline at end of file if there's content
  const finalContent = newContent.length > 0 && !newContent.endsWith(os.EOL)
    ? newContent + os.EOL
    : newContent;

  await fs.writeFile(exampleFilePath, finalContent, "utf-8");

  return { added, updated, removed, unchanged };
}

/**
 * Syncs a .env file to all its corresponding example files
 */
export async function syncEnvToAllExamples(envFilePath: string): Promise<void> {
  const config = getSyncConfig();
  const exampleFiles = await getExampleFilesForEnv(envFilePath);

  if (exampleFiles.length === 0) {
    return;
  }

  let totalAdded = 0;
  let totalUpdated = 0;
  let totalRemoved = 0;
  let filesUpdated = 0;

  for (const exampleFile of exampleFiles) {
    const result = await syncEnvToExample(
      envFilePath,
      exampleFile.fsPath,
      config.placeholder
    );

    Logger.instance.logInfo(
      `Synced ${path.basename(envFilePath)} → ${path.basename(exampleFile.fsPath)}: ${result.added.length} added, ${result.updated.length} updated, ${result.removed.length} removed, ${result.unchanged} unchanged`
    );

    if (result.added.length > 0 || result.updated.length > 0 || result.removed.length > 0) {
      filesUpdated++;
      totalAdded += result.added.length;
      totalUpdated += result.updated.length;
      totalRemoved += result.removed.length;
    }
  }

  if (filesUpdated > 0) {
    const parts = [];
    if (totalAdded > 0) parts.push(`${totalAdded} added`);
    if (totalUpdated > 0) parts.push(`${totalUpdated} updated`);
    if (totalRemoved > 0) parts.push(`${totalRemoved} removed`);

    const message = `.env Manager: Synced to ${filesUpdated} example file(s). ${parts.join(", ")}.`;
    vscode.window.showInformationMessage(message);
  }
}
