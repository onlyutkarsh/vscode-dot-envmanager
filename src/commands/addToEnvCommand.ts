import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { Uri, window } from "vscode";
import { getSelectedText, replaceText } from "../handlers/activeEditorHandler";
import { getRootEnvFile } from "../handlers/envHandler";
export async function addToEnv() {
  let { envFile, rootFolder } = await getRootEnvFile();
  if (envFile !== undefined) {
    await addLineToEnv(envFile);
  } else {
    const response = await window.showWarningMessage(`Could not find .env file in ${rootFolder.uri.path} folder. Do you want to create one?`, "Create .env", "Dismiss");
    if (response === "Create .env") {
      try {
        let newEnvFile = path.join(rootFolder.uri.fsPath, ".env");
        await fs.writeFile(newEnvFile, "", "utf-8");
        let result = await getRootEnvFile();
        if (result.envFile === undefined) {
          throw new Error("Error creating .env file");
        }
        addLineToEnv(result.envFile);
      } catch (e) {
        console.log(e);
        window.showErrorMessage("Unable to create .env file. Please create .env file manually and try again.");
      }
    }
  }
}
async function addLineToEnv(envFile: Uri) {
  let selected = getSelectedText().trim() || "VALUE";
  let includeInQuotes = /\s/.test(selected);
  let value = includeInQuotes ? `'${selected}'` : selected;
  let envVariable = "VAR_NAME";

  envVariable =
    (await window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: envVariable,
      prompt: `Add to .env file`,
      title: "Env Manager: Add to .env",
      value: envVariable,
      valueSelection: [0, envVariable.length],
      validateInput: (text) => {
        return text === undefined || text.trim() === "" ? "This is not a valid input!" : null;
      },
    })) || "";
  let envLine = `${envVariable}=${value}`;

  await fs.appendFile(envFile.fsPath, `${envLine}${os.EOL}`, "utf8");
  replaceText(envVariable);

  window.showInformationMessage(`Env Manager: Added ${envVariable} to .env`);
}
