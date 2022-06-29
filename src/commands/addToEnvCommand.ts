import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { getSelectedText, replaceText } from "../handlers/activeEditorHandler";
import { getRootEnvFile } from "../handlers/envHandler";
import { Buttons, Messages } from "../utilities/constants";
import { Logger } from "../utilities/logger";

export async function addToEnv() {
  const { envFile, rootFolder } = await getRootEnvFile();
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
  Logger.instance.logInfo("Prompt for variable name");
  const envVariable = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    placeHolder: Messages.NAME_FOR_VARIABLE,
    prompt: Messages.NAME_FOR_VARIABLE,
    title: Messages.ADD_TO_ENV,
    value: Messages.DEFAULT_VAR_NAME,
    valueSelection: [0, Messages.NAME_FOR_VARIABLE.length],
    validateInput: (text) => {
      return text === undefined || text.length === 0 ? Messages.VARIABLE_CANNOT_BE_EMPTY : null;
    },
  });

  if (!envVariable) {
    Logger.instance.logWarning("Unable to get variable name...probably Esc key pressed");
    return;
  }

  Logger.instance.logInfo("Attempt to get selected text");
  let selectedText = getSelectedText();
  if (selectedText.length === 0) {
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
  }
  if (selectedText.length === 0) {
    Logger.instance.logWarning("Unable to get variable value...probably Esc key pressed");
    return;
  }
  const includeInQuotes = /\s/.test(selectedText);
  const envValue = includeInQuotes ? `'${selectedText}'` : selectedText;

  const envLine = `${envVariable}=${envValue}`;

  await fs.appendFile(envFile.fsPath, `${envLine}${os.EOL}`);
  replaceText(envVariable);
  Logger.instance.logInfo("Line added to .env file");

  vscode.window.showInformationMessage(`.env Manager: Added ${envVariable} to .env`);
}
