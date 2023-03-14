import { createFakeType, getStringifiedType, mergeTypeWithNames } from "./fake-type.utils";

describe("mergeTypeWithNames", () => {
  const t1 = createFakeType("string");
  const t2 = createFakeType("User");
  const t3 = createFakeType("42");

  it("should return the intersection of basic fake types", () => {
    const result = mergeTypeWithNames([t1, t2, t3]);

    expect(getStringifiedType(result).getText()).toBe("string & User & 42");
  });

  it("should combine literal types", () => {
    const literal1 = { literal: { name: t1 } };
    const literal2 = { literal: { name: t2 } };
    const literal3 = { literal: { fields: { literal: { length: t3 } } } };
    const literal4 = { literal: { fields: { literal: { value: t1 } } } };
    const result = mergeTypeWithNames([literal1, literal2, literal3, literal4]);

    expect(getStringifiedType(result).getText()).toBe(
      `{"name": string & User, "fields": {"length": 42, "value": string}}`
    );
  });
});
