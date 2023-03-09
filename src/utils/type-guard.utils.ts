export function combineGuards<I, T extends I, U extends I>(g1: (x: I) => x is T, g2: (x: I) => x is U) {
  return (x: I): x is T | U => g1(x) || g2(x);
}
