import { window } from "vscode";
import { getSelectedText } from "../handlers/activeEditorHandler";
import { toEnvironmentVariable } from "../utilities/stringUtilities";
export async function addToEnv() {
  let selected = getSelectedText();
  let envVariable = toEnvironmentVariable(selected);
  let envLine = `${envVariable}=${selected}`;
  window.showInputBox({
    ignoreFocusOut: true,
    placeHolder: envLine,
    prompt: "Enter a name for the environment variable",
    title: "Add to .env",
    value: envLine,
    valueSelection: [0, envVariable.length],
  });
  window.showInformationMessage(`Added ${selected} to .env`);
}
