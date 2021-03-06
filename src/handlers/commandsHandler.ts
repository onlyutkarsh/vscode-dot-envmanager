import { commands, Disposable } from "vscode";
import { addToEnv } from "../commands/addToEnvCommand";
import { Logger } from "../utilities/logger";
export default class CommandsHandler {
  private commandsList: Disposable[] = [];

  constructor() {
    Logger.instance.logInfo("Registering commands");
    this.registerCommand("envmanager.addToEnv", () => addToEnv());
  }

  public getCommands = () => this.commandsList;

  private registerCommand(commandId: string, commandCallback: (...args: unknown[]) => unknown) {
    const command = commands.registerCommand(commandId, commandCallback);

    this.commandsList.push(command);
    Logger.instance.logInfo("Command registration completed");
  }
}
