import * as vscode from "vscode";
import CommandsHandler from "./handlers/commandsHandler";
import { Logger } from "./utilities/logger";

export async function activate({ subscriptions, storageUri }: vscode.ExtensionContext) {
  Logger.instance.logInfo("Activating extension");
  const commandHandler = new CommandsHandler();
  subscriptions.push(...commandHandler.getCommands());
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
