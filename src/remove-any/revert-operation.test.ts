import { concatRevertableOperation, RevertableOperation } from "./revert-operation";

describe("concatRevertableOperation", () => {
  it("should concat the count and the behaviour of the revert", () => {
    const r1: RevertableOperation = { countChangesDone: 2, countOfAnys: 3, revert: jest.fn() };
    const r2: RevertableOperation = { countChangesDone: 4, countOfAnys: 5, revert: jest.fn() };

    const result = concatRevertableOperation(r1, r2);

    expect(result.countChangesDone).toStrictEqual(6);
    expect(result.countOfAnys).toStrictEqual(8);
    expect(r1.revert).not.toHaveBeenCalled();
    expect(r2.revert).not.toHaveBeenCalled();

    result.revert();

    expect(r1.revert).toHaveBeenCalled();
    expect(r2.revert).toHaveBeenCalled();
  });
});
