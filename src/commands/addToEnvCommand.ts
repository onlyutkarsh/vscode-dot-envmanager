import fs from "fs/promises";
import os from "os";
import { window } from "vscode";
import { getSelectedText } from "../handlers/activeEditorHandler";
import { fileExists, getRootEnvFile } from "../handlers/envHandler";

export async function addToEnv() {
  let selected = getSelectedText().trim() || "VALUE";
  let includeInQuotes = /\s/.test(selected);
  let value = includeInQuotes ? `'${selected}'` : selected;
  let envVariable = "VAR_NAME";
  let envLine = `${envVariable}=${value}`;
  let final =
    (await window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: envLine,
      prompt: "Enter a name for the environment variable",
      title: "Add to .env",
      value: envLine,
      valueSelection: [0, envVariable.length],
      validateInput: (text) => {
        return text === undefined || text.trim() === "" ? "This is not a valid input!" : null;
      },
    })) || "";

  var { envFile, rootFolder } = await getRootEnvFile();
  if (final !== "" && (await fileExists(envFile))) {
    await fs.appendFile(envFile.fsPath, `${final}${os.EOL}`, "utf8");
    window.showInformationMessage(`Added ${final} to .env`);
  }
}
