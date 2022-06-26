import fs from "fs/promises";
import os from "os";
import { window } from "vscode";
import * as controls from "../controls/multiStepInput";
import { InputState } from "../entities/inputState";
import { getSelectedText } from "../handlers/activeEditorHandler";
import { fileExists, getRootEnvFile } from "../handlers/envHandler";

export async function addToEnv() {
  const state = {} as Partial<InputState>;

  await controls.MultiStepInput.run((input) => createEnvLine(input, state));

  let final = state.envLine || "";

  var { envFile, rootFolder } = await getRootEnvFile();
  if (final !== "" && (await fileExists(envFile))) {
    await fs.appendFile(envFile.fsPath, `${final}${os.EOL}`, "utf8");
    window.showInformationMessage(`Added ${final} to .env`);
  }
}
async function createEnvLine(input: controls.MultiStepInput, state: Partial<InputState>) {
  let selected = getSelectedText().trim() || "VALUE";
  let includeInQuotes = /\s/.test(selected);
  let value = includeInQuotes ? `'${selected}'` : selected;
  let envVariable = "VAR_NAME";
  let envLine = `${envVariable}=${value}`;

  state.envLine =
    (await input.showInputBox({
      title: "Add environment variable",
      step: 1,
      totalSteps: 2,
      ignoreFocusOut: true,
      placeholder: envLine,
      shouldResume: () => new Promise<boolean>(() => {}),
      prompt: "Enter a name for the environment variable",
      value: envLine,
      validate: (text) => {
        return text === undefined || text.trim() === "" ? "This is not a valid input!" : undefined;
      },
    })) || "";
}
