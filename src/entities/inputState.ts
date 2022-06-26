import * as controls from "../controls/multiStepInput";
export class InputState implements controls.State {
  title: string;
  step: number;
  totalSteps: number;
  name: string;
  envLine: string;
  envName: string;
}
