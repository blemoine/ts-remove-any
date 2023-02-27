export interface RevertableOperation {
  revert(): void;
  countChangesDone: number;
}

export const noopRevertableOperation: RevertableOperation = {
  countChangesDone: 0,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  revert() {},
};

export function concatRevertableOperation(r1: RevertableOperation, r2: RevertableOperation): RevertableOperation {
  return {
    countChangesDone: r1.countChangesDone + r2.countChangesDone,
    revert() {
      r1.revert();
      r2.revert();
    },
  };
}
