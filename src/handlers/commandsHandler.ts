import { commands, Disposable } from "vscode";
import { helloWorld } from "../commands/helloWorldCommand";
export default class CommandsHandler {
  private commandsList: Disposable[] = [];

  constructor() {
    this.registerCommand("envmanager.helloWorld", () => helloWorld("utkarsh"));
  }

  public getCommands = () => this.commandsList;

  private registerCommand(commandId: string, commandCallback: (...args: unknown[]) => unknown) {
    const command = commands.registerCommand(commandId, commandCallback);

    this.commandsList.push(command);
  }
}
