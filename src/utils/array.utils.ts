export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export function partition<A, B>(arr: readonly (A | B)[], guard: (a: A | B) => a is B): [B[], A[]] {
  return arr.reduce<[B[], A[]]>(
    ([bs, as], ab) => {
      if (guard(ab)) {
        bs.push(ab);
      } else {
        as.push(ab);
      }
      return [bs, as];
    },
    [[], []]
  );
}

export function deduplicate<A, B>(arr: readonly A[], keyFn: (a: A) => B): A[] {
  return [
    ...arr
      .reduce((map, a: A) => {
        const key = keyFn(a);
        if (!map.has(key)) {
          map.set(key, a);
        }
        return map;
      }, new Map<B, A>())
      .values(),
  ];
}
