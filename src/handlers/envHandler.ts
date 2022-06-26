import { TextDecoder } from "util";
import { Uri, workspace, WorkspaceFolder } from "vscode";

export async function getRootEnvFile(): Promise<{ envFile: Uri; rootFolder: WorkspaceFolder }> {
  let [envFile] = await workspace.findFiles("*.env", undefined, 1);
  let [rootFolder] = workspace.workspaceFolders as WorkspaceFolder[];
  return { envFile, rootFolder };
}

export async function getEnvContent(envFile: Uri) {
  return workspace.fs.readFile(envFile);
}

export async function getEnvContentAsString(envFile: Uri) {
  return new TextDecoder("utf-8").decode(await workspace.fs.readFile(envFile));
}

export async function fileExists(envFile: Uri) {
  try {
    const file = await workspace.fs.stat(envFile);
    return file.size !== 0;
  } catch (error) {
    return false;
  }
}
