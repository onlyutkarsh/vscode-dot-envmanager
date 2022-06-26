import * as vscode from "vscode";
import CommandsHandler from "./handlers/commandsHandler";
import { getRootEnvFile } from "./handlers/envHandler";

export async function activate({ subscriptions, storageUri }: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "envmanager" is now active!');

  // Making sure a workspace is opened so we can assert workspace related objects later
  if (storageUri === undefined) {
    vscode.window.showWarningMessage("No workspace open");
    return;
  }

  let { envFile, rootFolder } = await getRootEnvFile();
  console.log(envFile.fsPath);
  console.log(rootFolder.uri.fsPath);
  const commandHandler = new CommandsHandler();
  subscriptions.push(...commandHandler.getCommands());
}

// this method is called when your extension is deactivated
export function deactivate() {}
