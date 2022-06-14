export function padLeft(value: any, length: number, character: string): string {
  value = String(value);
  if (value.length > length) { return value; }
  return Array(length - value.length + 1).join(character || " ") + value;
}

export function capitalize(str: string | null) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str
}