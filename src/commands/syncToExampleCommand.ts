import * as vscode from "vscode";
import { getRootEnvFile } from "../handlers/envHandler";
import { Logger } from "../utilities/logger";
import { syncEnvToAllExamples } from "../utilities/syncUtilities";

/**
 * Command to manually sync .env file to example files
 */
export async function syncToExample() {
  Logger.instance.logInfo("Sync to example command triggered");

  const { envFile, cancelled } = await getRootEnvFile();

  // If user cancelled the file selection, exit early
  if (cancelled) {
    Logger.instance.logInfo("Command cancelled by user during file selection");
    return;
  }

  if (!envFile) {
    vscode.window.showWarningMessage(".env Manager: No .env file found to sync.");
    Logger.instance.logWarning("No .env file found");
    return;
  }

  try {
    await syncEnvToAllExamples(envFile.fsPath);
    Logger.instance.logInfo("Manual sync completed successfully");
  } catch (error) {
    Logger.instance.logError("Error during manual sync", error as Error);
    vscode.window.showErrorMessage(
      `.env Manager: Failed to sync to example files. ${(error as Error).message}`
    );
  }
}
