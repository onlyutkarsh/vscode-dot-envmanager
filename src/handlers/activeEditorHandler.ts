import { Selection, window } from "vscode";
import { Logger } from "../utilities/logger";
export function getSelectedText(): string {
  Logger.instance.logInfo("Getting selected text from editor");
  const editor = window.activeTextEditor;
  let selectedText = "";
  if (editor) {
    const document = editor.document;
    const selection = editor.selection;

    selectedText = document.getText(selection);
    Logger.instance.logInfo("Returning selected text");
  } else {
    Logger.instance.logWarning("No editors open select text");
  }
  return selectedText;
}

export function replaceText(newText: string) {
  Logger.instance.logInfo("Replacing text in the editor");
  const editor = window.activeTextEditor;
  if (editor) {
    const selection = editor.selection;
    editor.edit((editBuilder) => {
      editBuilder.replace(selection, newText);
      Logger.instance.logInfo("Text was replaced in the editor");
    });
    Logger.instance.logInfo("Setting the cursor to beginning of the replaced text");
    const currentPosition = selection.active;
    const newPosition = currentPosition.with(currentPosition.line, selection.start.character);
    const newSelection = new Selection(newPosition, newPosition);
    editor.selection = newSelection;
  } else {
    Logger.instance.logWarning("No editors open to replace text");
  }
}
