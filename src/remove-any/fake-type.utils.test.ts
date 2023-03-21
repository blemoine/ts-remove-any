import { getStringifiedType, getSupertype } from "./fake-type.utils";
import { TypeModel } from "./type-model/type-model";

describe("getSupertype", () => {
  const t1: TypeModel = { kind: "string" };
  const t2: TypeModel = { kind: "object", alias: "User", value: () => ({}) };
  const t3: TypeModel = { kind: "number-literal", value: 42 };

  it("should return the intersection of basic fake types", () => {
    const result = getSupertype([t1, t2, t3]);

    expect(getStringifiedType(result)).toBe("string & User & 42");
  });

  it("should return the intersection of basic fake types and deduplicate if the same type appear multiple times", () => {
    const result = getSupertype([t1, t2, t3, t1, t3]);

    expect(getStringifiedType(result)).toBe("string & User & 42");
  });

  it("should combine literal types", () => {
    const literal1 = { literal: { name: t1 } };
    const literal2 = { literal: { name: t2 } };
    const literal3 = { literal: { fields: { literal: { length: t3 } } } };
    const literal4 = { literal: { fields: { literal: { value: t1 } } } };
    const result = getSupertype([literal1, literal2, literal3, literal4]);

    expect(getStringifiedType(result)).toBe(`{"name": string & User, "fields": {"length": 42, "value": string}}`);
  });
});
