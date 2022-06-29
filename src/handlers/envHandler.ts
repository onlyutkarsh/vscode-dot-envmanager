import { TextDecoder } from "util";
import * as vscode from "vscode";

export async function getRootEnvFile(): Promise<{ envFile: vscode.Uri; rootFolder: vscode.Uri | undefined }> {
  const [envFile] = await vscode.workspace.findFiles("*.env", undefined, 1);
  let rootFolder = undefined;
  if (vscode.workspace.workspaceFolders) {
    // a workspace is open
    rootFolder = vscode.workspace.workspaceFolders[0].uri;
    return { envFile, rootFolder };
  }
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
