export function toUpper(input: string): string {
  return input.toUpperCase();
}

export function toEnvironmentVariable(input: string): string {
  let envVariable = input.replace(/[\\$'"]+/g, "").replace(" ", "_");
  return envVariable.toUpperCase();
}
