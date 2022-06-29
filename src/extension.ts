import * as vscode from "vscode";
import CommandsHandler from "./handlers/commandsHandler";

export async function activate({ subscriptions, storageUri }: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "envmanager" is now active!');
  const commandHandler = new CommandsHandler();
  subscriptions.push(...commandHandler.getCommands());
  // Making sure a workspace is opened so we can assert workspace related objects later
  if (storageUri === undefined) {
    return;
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
