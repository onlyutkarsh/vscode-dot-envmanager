import { window } from "vscode";
import { toUpper } from "../utilities/stringUtilities";
export async function helloWorld(message: string) {
  window.showInformationMessage(`Hello ${toUpper(message)} from .env Manager!`);
}
