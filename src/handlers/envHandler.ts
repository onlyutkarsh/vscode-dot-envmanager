import * as vscode from "vscode";
import { Logger } from "../utilities/logger";

export async function getRootEnvFile(): Promise<{ envFile: vscode.Uri | undefined; rootFolder: vscode.Uri | undefined; cancelled?: boolean }> {
  Logger.instance.logInfo("Searching .env file in the workspace root");

  let rootFolder = undefined;
  if (vscode.workspace.workspaceFolders) {
    rootFolder = vscode.workspace.workspaceFolders[0].uri;
    Logger.instance.logInfo("Workspace has a folder open");
  }

  // First try to find .env (exact match, highest priority)
  let [envFile] = await vscode.workspace.findFiles("**/.env", "**/node_modules/**", 1);

  if (!envFile) {
    // If no .env found, look for .env.local, .env.development, etc.
    // Exclude template files (.env.example, .env.sample, .env.template)
    const allEnvFiles = await vscode.workspace.findFiles(
      "**/.env.*",
      "**/node_modules/**"
    );

    // Filter out template/example files
    const validEnvFiles = allEnvFiles.filter(file => {
      const fileName = file.path.split("/").pop()?.toLowerCase() || "";
      return !fileName.includes("example") &&
             !fileName.includes("sample") &&
             !fileName.includes("template");
    });

    if (validEnvFiles.length > 0) {
      if (validEnvFiles.length === 1) {
        // Only one valid file found, use it
        envFile = validEnvFiles[0];
        Logger.instance.logInfo(`Found env file: ${envFile.path}`);
      } else {
        // Multiple files found, let user choose
        Logger.instance.logInfo(`Found ${validEnvFiles.length} env files, prompting user to choose`);
        const items = validEnvFiles.map(file => ({
          label: file.path.split("/").pop() || file.path,
          description: file.path,
          uri: file
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: "Multiple .env files found. Select one to add the variable to:",
          ignoreFocusOut: true
        });

        if (selected) {
          envFile = selected.uri;
          Logger.instance.logInfo(`User selected: ${envFile.path}`);
        } else {
          Logger.instance.logWarning("User cancelled file selection");
          return { envFile: undefined, rootFolder, cancelled: true };
        }
      }
    }
  } else {
    Logger.instance.logInfo("Found .env file");
  }

  if (!vscode.workspace.workspaceFolders) {
    Logger.instance.logWarning("No workspace folders open");
  }

  return { envFile, rootFolder };
}

export async function getEnvContent(envFile: vscode.Uri) {
  return vscode.workspace.fs.readFile(envFile);
}

export async function getEnvContentAsString(envFile: vscode.Uri) {
  const content = await vscode.workspace.fs.readFile(envFile);
  // Convert Uint8Array to string using proper UTF-8 decoding
  return Buffer.from(content).toString("utf8");
}

export async function fileExists(envFile: vscode.Uri) {
  try {
    const file = await vscode.workspace.fs.stat(envFile);
    return file.size !== 0;
  } catch (error) {
    return false;
  }
}
