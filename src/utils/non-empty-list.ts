export type NonEmptyList<T> = [T, ...T[]];
export function isNonEmptyList<T>(arr: T[]): arr is NonEmptyList<T> {
  return arr.length > 0;
}
