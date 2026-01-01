import * as vscode from "vscode";
import CommandsHandler from "./handlers/commandsHandler";
import { Logger } from "./utilities/logger";
import { isActualEnvFile, getSyncConfig, syncEnvToAllExamples } from "./utilities/syncUtilities";

export async function activate({ subscriptions, storageUri }: vscode.ExtensionContext) {
  Logger.instance.logInfo("Activating extension");
  const commandHandler = new CommandsHandler();
  subscriptions.push(...commandHandler.getCommands());

  // Set up file watcher for auto-sync on save
  const fileWatcher = vscode.workspace.onDidSaveTextDocument(async (document) => {
    const fileName = document.fileName.split(/[\\/]/).pop() || "";
    const config = getSyncConfig();

    // Only sync if enabled in configuration
    if (!config.enabled) {
      return;
    }

    // Only sync actual .env files, not example files
    if (isActualEnvFile(fileName)) {
      try {
        await syncEnvToAllExamples(document.fileName);
      } catch (error) {
        Logger.instance.logError("Error during auto-sync", error as Error);
        // Don't show error to user for auto-sync, just log it
      }
    }
  });

  subscriptions.push(fileWatcher);

  // Making sure a workspace is opened so we can assert workspace related objects later
  if (storageUri === undefined) {
    Logger.instance.logWarning("No workspace folders open");
  }
  Logger.instance.logInfo("Activation finished");
}

// this method is called when your extension is deactivated
export function deactivate() {
  Logger.instance.logInfo("Extension deactivated");
}
