import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { getSelectedText, replaceText } from "../handlers/activeEditorHandler";
import { getRootEnvFile } from "../handlers/envHandler";
import { Buttons, Messages } from "../utilities/constants";

export async function addToEnv() {
  const { envFile, rootFolder } = await getRootEnvFile();
  if (envFile !== undefined) {
    await addLineToEnv(envFile);
  } else {
    if (rootFolder) {
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
              if (rootFolder) {
                const newEnvFile = path.join(rootFolder.path, ".env");
                progress.report({ message: Messages.CREATING_FILE });
                await fs.writeFile(newEnvFile, "", "utf-8");
                const result = await getRootEnvFile();
                if (result.envFile === undefined) {
                  throw new Error(Messages.UNABLE_TO_CREATE_FILE);
                }
                progress.report({ message: Messages.ADDING_VARIABLE_TO_ENV });

                addLineToEnv(result.envFile);

                const p = new Promise<void>((resolve) => {
                  resolve();
                });

                return p;
              }
            } catch (e) {
              console.log(e);
              vscode.window.showErrorMessage(Messages.UNABLE_TO_CREATE_FILE);
            }
          }
        );
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
  let envVariable = Messages.DEFAULT_VAR_NAME;

  envVariable =
    (await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: envVariable,
      prompt: Messages.NAME_FOR_VARIABLE,
      title: Messages.ADD_TO_ENV,
      value: envVariable,
      valueSelection: [0, envVariable.length],
      validateInput: (text) => {
        return text === undefined || text.length === 0 ? Messages.VARIABLE_CANNOT_BE_EMPTY : null;
      },
    })) || "";

  if (envVariable.trim().length === 0) {
    return;
  }

  let selectedText = getSelectedText();
  if (selectedText.length === 0) {
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
  if (selectedText.trim().length === 0) {
    return;
  }
  const includeInQuotes = /\s/.test(selectedText);
  const envValue = includeInQuotes ? `'${selectedText}'` : selectedText;

  const envLine = `${envVariable}=${envValue}`;

  await fs.appendFile(envFile.fsPath, `${envLine}${os.EOL}`);
  replaceText(envVariable);

  vscode.window.showInformationMessage(`.env Manager: Added ${envVariable} to .env`);
}
