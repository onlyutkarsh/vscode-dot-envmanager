import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "envmanager" is now active!');

  let disposable = vscode.commands.registerCommand("envmanager.helloWorld", () => {
    vscode.window.showInformationMessage("Hello World from .env Manager!");
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
