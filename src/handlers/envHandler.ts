import { TextDecoder } from "util";
import { Uri, workspace, WorkspaceFolder } from "vscode";

export default class EnvHandler {
  public readonly firstEnvFile: Uri;
  public readonly rootFolder: WorkspaceFolder;

  constructor(firstEnvFile: Uri, rootFolder: WorkspaceFolder) {
    firstEnvFile = firstEnvFile;
    rootFolder = rootFolder;
  }
  public static async getRootEnvFile(): Promise<{ envFile: Uri; rootFolder: WorkspaceFolder }> {
    let [envFile] = await workspace.findFiles("*.env", undefined, 1);
    let [rootFolder] = workspace.workspaceFolders as WorkspaceFolder[];
    return { envFile, rootFolder };
  }

  public static async getEnvContent(envFile: Uri) {
    return workspace.fs.readFile(envFile);
  }

  public static async getEnvContentAsString(envFile: Uri) {
    return new TextDecoder("utf-8").decode(await workspace.fs.readFile(envFile));
  }

  public async fileExists(envFile: Uri) {
    try {
      const file = await workspace.fs.stat(envFile);
      return file.size !== 0;
    } catch (error) {
      return false;
    }
  }
}
