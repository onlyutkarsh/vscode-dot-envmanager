import { Selection, window, workspace } from "vscode";
import { Logger } from "../utilities/logger";
import { suggestEnvVarFormat } from "../utilities/stringUtilities";

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

export function getCurrentLanguageId(): string | undefined {
  const editor = window.activeTextEditor;
  if (editor) {
    return editor.document.languageId;
  }
  return undefined;
}

export function replaceText(variableName: string, useLanguageSpecificFormat: boolean = true) {
  Logger.instance.logInfo("Replacing text in the editor");
  const editor = window.activeTextEditor;
  if (editor) {
    const languageId = editor.document.languageId;

    // Read configuration
    const config = workspace.getConfiguration("envmanager");
    const enableFormatting = config.get<boolean>("enableLanguageSpecificFormat", true);
    const formatConfig = config.get<Record<string, string>>("variableFormat");

    let newText = variableName;
    if (useLanguageSpecificFormat && enableFormatting) {
      newText = suggestEnvVarFormat(variableName, languageId, formatConfig);
    }

    Logger.instance.logInfo(`Replacing with: ${newText} (language: ${languageId}, formatting: ${enableFormatting})`);

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
