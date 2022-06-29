import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { ProgressLocation, Uri, window } from "vscode";
import { getSelectedText, replaceText } from "../handlers/activeEditorHandler";
import { getRootEnvFile } from "../handlers/envHandler";

export async function addToEnv() {
  let { envFile, rootFolder } = await getRootEnvFile();
  if (envFile !== undefined) {
    await addLineToEnv(envFile);
  } else {
    const response = await window.showWarningMessage(`Could not find .env file in ${rootFolder.uri.path} folder. Do you want to create one?`, "Create .env", "Dismiss");
    if (response === "Create .env") {
      window.withProgress(
        {
          location: ProgressLocation.Notification,
          cancellable: false,
          title: ".env Manager: Creating .env file...",
        },
        async (progress) => {
          try {
            let newEnvFile = path.join(rootFolder.uri.fsPath, ".env");
            progress.report({ message: "Creating .env file..." });
            await fs.writeFile(newEnvFile, "", "utf-8");
            let result = await getRootEnvFile();
            if (result.envFile === undefined) {
              throw new Error("Error creating .env file");
            }
            progress.report({ message: "Adding variable to .env file.." });

            addLineToEnv(result.envFile);

            const p = new Promise<void>((resolve) => {
              resolve();
            });

            return p;
          } catch (e) {
            console.log(e);
            window.showErrorMessage("Unable to create .env file. Please create .env file manually and try again.");
          }
        }
      );
    }
  }
}

async function addLineToEnv(envFile: Uri) {
  let envVariable = "VAR_NAME";

  envVariable =
    (await window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: envVariable,
      prompt: `Enter a name for environment variable`,
      title: ".env Manager: Add to .env",
      value: envVariable,
      valueSelection: [0, envVariable.length],
      validateInput: (text) => {
        return text === undefined || text.length === 0 ? "Variable name cannot be empty!" : null;
      },
    })) || "";

  if (envVariable.trim().length === 0) {
    return;
  }

  let selectedText = getSelectedText();
  if (selectedText.length === 0) {
    selectedText =
      (await window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "VALUE",
        prompt: `Enter value for environment variable`,
        title: ".env Manager: Add to .env",
        value: "",
        valueSelection: undefined,
        validateInput: (text) => {
          return text === undefined || text.length === 0 ? "Value cannot be empty!" : null;
        },
      })) || "";
  }
  if (selectedText.trim().length === 0) {
    return;
  }
  let includeInQuotes = /\s/.test(selectedText);
  let envValue = includeInQuotes ? `'${selectedText}'` : selectedText;

  let envLine = `${envVariable}=${envValue}`;

  await fs.appendFile(envFile.fsPath, `${envLine}${os.EOL}`, "utf8");
  replaceText(envVariable);

  window.showInformationMessage(`.env Manager: Added ${envVariable} to .env`);
}
