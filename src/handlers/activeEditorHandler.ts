import { Selection, window } from "vscode";
export function getSelectedText(): string {
  let editor = window.activeTextEditor;
  let selectedText = "";
  if (editor) {
    const document = editor.document;
    const selection = editor.selection;

    selectedText = document.getText(selection);
  }
  return selectedText;
}

export function replaceText(newText: string) {
  let editor = window.activeTextEditor;
  if (editor) {
    const selection = editor.selection;
    editor.edit((editBuilder) => {
      editBuilder.replace(selection, newText);
    });
    const currentPosition = selection.active;
    const newPosition = currentPosition.with(currentPosition.line, selection.start.character);
    const newSelection = new Selection(newPosition, newPosition);
    editor.selection = newSelection;
  }
}