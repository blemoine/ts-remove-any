export interface RevertableOperation {
  revert(): void;
  countChangesDone: number;
  countOfAnys: number;
}

const noop = () => {};
export const noopRevertableOperation: RevertableOperation = {
  countChangesDone: 0,
  countOfAnys: 0,
  revert: noop,
};

export function concatRevertableOperation(r1: RevertableOperation, r2: RevertableOperation): RevertableOperation {
  return {
    countChangesDone: r1.countChangesDone + r2.countChangesDone,
    countOfAnys: r1.countOfAnys + r2.countOfAnys,
    revert() {
      r1.revert();
      r2.revert();
    },
  };
}
