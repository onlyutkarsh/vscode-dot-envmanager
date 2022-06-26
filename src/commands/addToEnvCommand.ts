import { window } from "vscode";
export async function addToEnv() {
  window.showInformationMessage(`Added to .env`);
}
