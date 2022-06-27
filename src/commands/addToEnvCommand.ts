import * as fs from "fs/promises";
import * as os from "os";
import { window } from "vscode";
import { getSelectedText, replaceText } from "../handlers/activeEditorHandler";
import { fileExists, getRootEnvFile } from "../handlers/envHandler";

export async function addToEnv() {
  let selected = getSelectedText().trim() || "VALUE";
  let includeInQuotes = /\s/.test(selected);
  let value = includeInQuotes ? `'${selected}'` : selected;
  let envVariable = "VAR_NAME";

  envVariable =
    (await window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: envVariable,
      prompt: `Add to .env file`,
      title: "Env Manager - Add to .env",
      value: envVariable,
      valueSelection: [0, envVariable.length],
      validateInput: (text) => {
        return text === undefined || text.trim() === "" ? "This is not a valid input!" : null;
      },
    })) || "";
  let envLine = `${envVariable}=${value}`;

  var { envFile, rootFolder } = await getRootEnvFile();
  if (envVariable.length > 0 && (await fileExists(envFile))) {
    await fs.appendFile(envFile.fsPath, `${envLine}${os.EOL}`, "utf8");
    replaceText(envVariable);

    window.showInformationMessage(`Env Manager - Added ${envVariable} to .env`);
  }
}
