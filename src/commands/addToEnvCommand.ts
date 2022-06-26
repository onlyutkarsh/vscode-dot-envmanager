import { window } from "vscode";
import { getSelectedText } from "../handlers/activeEditorHandler";

export async function addToEnv() {
  let selected = getSelectedText();
  window.showInformationMessage(`Added ${selected} to .env`);
}
