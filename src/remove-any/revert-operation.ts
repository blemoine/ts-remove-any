export interface RevertableOperation {
  revert(): void;
  countChangesDone: number;
}

export const noopRevertableOperation: RevertableOperation = {
  countChangesDone: 0,
  revert() {},
};
