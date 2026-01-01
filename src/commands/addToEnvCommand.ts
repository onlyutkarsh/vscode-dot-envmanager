import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { getSelectedText, replaceText } from "../handlers/activeEditorHandler";
import { getEnvContentAsString, getRootEnvFile } from "../handlers/envHandler";
import { Buttons, Messages } from "../utilities/constants";
import { Logger } from "../utilities/logger";
import { detectEnvVarReference } from "../utilities/stringUtilities";
import { getSyncConfig, syncEnvToAllExamples } from "../utilities/syncUtilities";

async function suggestAddingEnvToGitignore(rootFolder: vscode.Uri): Promise<void> {
  try {
    const gitignorePath = path.join(rootFolder.fsPath, ".gitignore");
    Logger.instance.logInfo("Checking if .gitignore exists and contains .env");

    let gitignoreContent = "";
    let gitignoreExists = true;
    try {
      gitignoreContent = await fs.readFile(gitignorePath, "utf-8");
    } catch (error) {
      // .gitignore doesn't exist
      gitignoreExists = false;
      Logger.instance.logInfo(".gitignore file not found");
    }

    // Check if .env is already in .gitignore
    const lines = gitignoreContent.split(/\r?\n/);
    const hasEnvEntry = lines.some((line) => {
      const trimmed = line.trim();
      return trimmed === ".env" || trimmed === "/.env" || trimmed === "*.env";
    });

    if (!hasEnvEntry) {
      Logger.instance.logInfo(".env not found in .gitignore, prompting user");
      const message = gitignoreExists
        ? "Add .env to .gitignore to prevent accidentally committing secrets?"
        : "Create .gitignore and add .env to it to prevent accidentally committing secrets?";

      const response = await vscode.window.showInformationMessage(message, Buttons.ADD_TO_GITIGNORE, Buttons.DISMISS);

      if (response === Buttons.ADD_TO_GITIGNORE) {
        Logger.instance.logInfo("User chose to add .env to .gitignore");
        const newContent = gitignoreContent.length > 0 && !gitignoreContent.endsWith("\n") ? gitignoreContent + os.EOL : gitignoreContent;
        const updatedContent = newContent + `# Environment variables${os.EOL}.env${os.EOL}`;
        await fs.writeFile(gitignorePath, updatedContent, "utf-8");
        Logger.instance.logInfo(".env added to .gitignore");
        vscode.window.showInformationMessage(".env Manager: Added .env to .gitignore");
      } else {
        Logger.instance.logInfo("User dismissed .gitignore suggestion");
      }
    } else {
      Logger.instance.logInfo(".env already exists in .gitignore");
    }
  } catch (error) {
    Logger.instance.logError("Error while checking/updating .gitignore", error as Error);
    // Don't block the main operation if .gitignore update fails
  }
}

export async function addToEnv() {
  const { envFile, rootFolder, cancelled } = await getRootEnvFile();

  // If user cancelled the file selection, exit early
  if (cancelled) {
    Logger.instance.logInfo("Command cancelled by user during file selection");
    return;
  }

  if (envFile !== undefined) {
    Logger.instance.logInfo("Adding line to .env");
    await addLineToEnv(envFile);
  } else {
    if (rootFolder) {
      Logger.instance.logWarning("Could not find .env file, prompt for options to create file");
      const response = await vscode.window.showWarningMessage(`Could not find .env file in ${rootFolder} folder. Do you want to create one?`, Buttons.CREATE_ENV, Buttons.DISMISS);
      if (response === Buttons.CREATE_ENV) {
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            cancellable: false,
            title: Messages.CREATING_FILE,
          },
          async (progress) => {
            try {
              Logger.instance.logInfo("Attempting to create .env file");
              const newEnvFile = path.join(rootFolder.path, ".env");
              progress.report({ message: Messages.CREATING_FILE });
              await fs.writeFile(newEnvFile, "", "utf-8");
              const result = await getRootEnvFile();
              Logger.instance.logInfo(".env file created");
              if (result.envFile === undefined) {
                Logger.instance.logError("Unable to find the .env file");
                throw new Error(Messages.UNABLE_TO_CREATE_FILE);
              }

              // Suggest adding .env to .gitignore
              await suggestAddingEnvToGitignore(rootFolder);

              progress.report({ message: Messages.ADDING_VARIABLE_TO_ENV });

              addLineToEnv(result.envFile);

              const p = new Promise<void>((resolve) => {
                resolve();
              });

              return p;
            } catch (error) {
              Logger.instance.logError("Exception while creating .env file", error as Error);
              vscode.window.showErrorMessage(Messages.UNABLE_TO_CREATE_FILE);
            }
          }
        );
      } else {
        Logger.instance.logInfo("User dismissed creating .env file");
      }
    } else {
      const result = await vscode.window.showWarningMessage(Messages.NEED_WORKSPACE, Buttons.OPEN_FOLDER, Buttons.DISMISS);
      if (result === Buttons.OPEN_FOLDER) {
        await vscode.commands.executeCommand(Messages.OPEN_FOLDER_COMMAND);
      }
    }
  }
}

async function addLineToEnv(envFile: vscode.Uri) {
  Logger.instance.logInfo("Attempt to get selected text");
  let selectedText = getSelectedText();

  // Detect if the selected text is an environment variable reference
  const detectionResult = detectEnvVarReference(selectedText);

  let suggestedVarName = Messages.DEFAULT_VAR_NAME;
  let valueSelectionRange: [number, number] = [0, Messages.DEFAULT_VAR_NAME.length];

  if (detectionResult.isEnvVarReference && detectionResult.variableName) {
    Logger.instance.logInfo(`Detected environment variable reference: ${detectionResult.pattern} - ${detectionResult.variableName}`);
    suggestedVarName = detectionResult.variableName;
    valueSelectionRange = [0, suggestedVarName.length];
  }

  Logger.instance.logInfo("Prompt for variable name");
  const envVariable = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    placeHolder: Messages.NAME_FOR_VARIABLE,
    prompt: detectionResult.isEnvVarReference
      ? `Detected variable: ${suggestedVarName}. Enter variable name or press Enter to use detected name.`
      : Messages.NAME_FOR_VARIABLE,
    title: Messages.ADD_TO_ENV,
    value: suggestedVarName,
    valueSelection: valueSelectionRange,
    validateInput: (text) => {
      if (!text || text.length === 0) {
        return Messages.VARIABLE_CANNOT_BE_EMPTY;
      }
      // Check for valid environment variable name format
      // Must start with letter or underscore, followed by letters, numbers, or underscores
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(text)) {
        return Messages.INVALID_VARIABLE_NAME;
      }
      // Allow any valid variable name (uppercase convention is just a suggestion)
      return null;
    },
  });

  if (!envVariable) {
    Logger.instance.logWarning("Unable to get variable name...probably Esc key pressed");
    return;
  }

  // If it was an env var reference, prompt for the actual value
  if (detectionResult.isEnvVarReference) {
    Logger.instance.logInfo("Detected env var reference, prompting for actual value");
    selectedText =
      (await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: Messages.DEFAULT_VALUE_NAME,
        prompt: Messages.NAME_FOR_VALUE,
        title: Messages.ADD_TO_ENV,
        value: "",
        valueSelection: undefined,
        validateInput: (text) => {
          return text === undefined || text.length === 0 ? Messages.VALUE_CANNOT_BE_EMPTY : null;
        },
      })) || "";

    if (selectedText.length === 0) {
      Logger.instance.logWarning("Unable to get variable value...probably Esc key pressed");
      return;
    }
  } else if (selectedText.length === 0) {
    Logger.instance.logInfo("Unable to get selected text...Prompting user for value");
    selectedText =
      (await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: Messages.DEFAULT_VALUE_NAME,
        prompt: Messages.NAME_FOR_VALUE,
        title: Messages.ADD_TO_ENV,
        value: "",
        valueSelection: undefined,
        validateInput: (text) => {
          return text === undefined || text.length === 0 ? Messages.VALUE_CANNOT_BE_EMPTY : null;
        },
      })) || "";

    if (selectedText.length === 0) {
      Logger.instance.logWarning("Unable to get variable value...probably Esc key pressed");
      return;
    }
  }

  // Check for duplicate variables
  Logger.instance.logInfo("Checking for duplicate variables");
  const envContent = await getEnvContentAsString(envFile);
  const variablePattern = new RegExp(`^\\s*${envVariable}\\s*=`, "m");

  if (variablePattern.test(envContent)) {
    Logger.instance.logWarning(`Variable ${envVariable} already exists in .env file`);
    const overwrite = await vscode.window.showWarningMessage(
      `Variable "${envVariable}" already exists in .env file. Do you want to overwrite it?`,
      { modal: true },
      Buttons.OVERWRITE,
      Buttons.CANCEL
    );

    if (overwrite !== Buttons.OVERWRITE) {
      Logger.instance.logInfo("User chose not to overwrite existing variable");
      return;
    }

    // Remove the existing line
    Logger.instance.logInfo("Removing existing variable line");
    const lines = envContent.split(/\r?\n/);
    const filteredLines = lines.filter(line => !variablePattern.test(line));
    const newContent = filteredLines.join(os.EOL);
    await fs.writeFile(envFile.fsPath, newContent, "utf-8");
  }

  const includeInQuotes = /\s/.test(selectedText);
  const envValue = includeInQuotes ? `'${selectedText}'` : selectedText;

  const envLine = `${envVariable}=${envValue}`;

  await fs.appendFile(envFile.fsPath, `${envLine}${os.EOL}`);

  // If it was an env var reference, keep the same format; otherwise replace with language-specific format
  if (detectionResult.isEnvVarReference && detectionResult.pattern) {
    // Keep the original format (e.g., process.env.VAR_NAME)
    Logger.instance.logInfo("Keeping original env var reference format");
    // Don't replace - the reference is already correct
  } else {
    // Replace with language-specific format (e.g., process.env.VAR_NAME for TypeScript)
    Logger.instance.logInfo("Replacing with language-specific env var format");
    replaceText(envVariable, true);
  }

  Logger.instance.logInfo("Line added to .env file");

  // Auto-sync to example files if enabled
  const config = getSyncConfig();
  if (config.enabled) {
    try {
      await syncEnvToAllExamples(envFile.fsPath);
    } catch (error) {
      Logger.instance.logError("Error during auto-sync after add", error as Error);
      // Don't fail the main operation if sync fails
    }
  }

  vscode.window.showInformationMessage(`.env Manager: Added ${envVariable} to .env`);
}
