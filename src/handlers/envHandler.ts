import { TextDecoder } from "util";
import * as vscode from "vscode";
import { Logger } from "../utilities/logger";

export async function getRootEnvFile(): Promise<{ envFile: vscode.Uri; rootFolder: vscode.Uri | undefined }> {
  Logger.instance.logInfo("Searching *.env file in the workspace root");
  const [envFile] = await vscode.workspace.findFiles("*.env", undefined, 1);
  let rootFolder = undefined;
  if (vscode.workspace.workspaceFolders) {
    // a workspace is open
    rootFolder = vscode.workspace.workspaceFolders[0].uri;
    Logger.instance.logInfo("Workspace has a folder open");
    return { envFile, rootFolder };
  }
  Logger.instance.logWarning("No workspace folders open");
  return { envFile, rootFolder };
}

export async function getEnvContent(envFile: vscode.Uri) {
  return vscode.workspace.fs.readFile(envFile);
}

export async function getEnvContentAsString(envFile: vscode.Uri) {
  return new TextDecoder("utf-8").decode(await vscode.workspace.fs.readFile(envFile));
}

export async function fileExists(envFile: vscode.Uri) {
  try {
    const file = await vscode.workspace.fs.stat(envFile);
    return file.size !== 0;
  } catch (error) {
    return false;
  }
}
