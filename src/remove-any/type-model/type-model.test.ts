import { getSerializedTypeModel, getSupertype, IntersectionTypeModel, ObjectTypeModel } from "./type-model";

describe("getSupertype", () => {
  it("should merge properly intersection types", () => {
    const nameObject: ObjectTypeModel = {
      kind: "object",
      value: () => ({
        name: {
          kind: "string",
        },
      }),
    };
    const ageObject: ObjectTypeModel = {
      kind: "object",
      value: () => ({
        age: {
          kind: "number",
        },
        update: {
          kind: "unsupported",
          value: () => "Date",
        },
      }),
    };

    const intersectionModel: IntersectionTypeModel = { kind: "intersection", value: () => [ageObject] };
    const result = getSupertype([nameObject, intersectionModel]);

    expect(getSerializedTypeModel(result).name).toStrictEqual('{"name": string; "age": number; "update": Date}');
  });
});
