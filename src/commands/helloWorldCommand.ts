import { window } from "vscode";
export async function helloWorld(message: string) {
  window.showInformationMessage(`Hello ${message} from .env Manager!`);
}
