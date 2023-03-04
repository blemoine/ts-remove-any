export function cannotHappen(x: never): never {
  throw new Error(`${x} is not a valid value`);
}
