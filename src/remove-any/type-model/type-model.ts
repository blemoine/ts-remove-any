import { Type, Node } from "ts-morph";
import { isNotNil } from "../../utils/is-not-nil";
import { partition } from "../../utils/array.utils";
import { NonEmptyList } from "../../utils/non-empty-list";

interface IntersectionTypeModel {
  kind: "intersection";
  value: () => TypeModel[];
  alias?: string;
  original?: Type;
}
interface UnionTypeModel {
  kind: "union";
  value: () => TypeModel[];
  alias?: string;
  original?: Type;
}
interface FunctionTypeModel {
  kind: "function";
  parameters: Record<string, TypeModel>;
  returnType: TypeModel;
  alias?: string;
  original?: Type;
}
interface ObjectTypeModel {
  kind: "object";
  value: () => Record<string, TypeModel>;
  alias?: string;
  original?: Type;
}
function isObjectTypeModel(typeModel: TypeModel): typeModel is ObjectTypeModel {
  return typeModel.kind === "object";
}

export type TypeModel =
  | { kind: "" }
  | { kind: "number"; original?: Type }
  | { kind: "number-literal"; value: number; original?: Type }
  | { kind: "string"; original?: Type }
  | { kind: "string-literal"; value: string; original?: Type }
  | { kind: "boolean"; original?: Type }
  | { kind: "boolean-literal"; value: boolean; original?: Type }
  | { kind: "unknown"; original?: Type }
  | { kind: "null"; original?: Type }
  | { kind: "any"; original?: Type }
  | { kind: "undefined"; original?: Type }
  | { kind: "never"; original?: Type }
  | { kind: "array"; value: () => TypeModel; readonly: boolean; alias?: string; original?: Type }
  | { kind: "tuple"; value: () => TypeModel[]; readonly: boolean; alias?: string; original?: Type }
  | FunctionTypeModel
  | ObjectTypeModel
  | UnionTypeModel
  | IntersectionTypeModel
  | { kind: "unsupported"; value: () => string };

export function getText(typeModel: TypeModel): string {
  switch (typeModel.kind) {
    case "":
      return "";
    case "number":
      return "number";
    case "number-literal":
      return `${typeModel.value}`;
    case "string":
      return "string";
    case "string-literal":
      return typeModel.value;
    case "boolean":
      return "boolean";
    case "boolean-literal":
      return `${typeModel.value}`;
    case "unknown":
      return "unknown";
    case "null":
      return "null";
    case "undefined":
      return "undefined";
    case "never":
      return "never";
    case "any":
      return "any";
    case "tuple":
      if (typeModel.alias) {
        return typeModel.alias;
      }
      return `${typeModel.readonly ? "readonly " : ""}[${typeModel
        .value()
        .map((t) => getText(t))
        .join(", ")}]`;
    case "array":
      if (typeModel.alias) {
        return typeModel.alias;
      }
      return `${typeModel.readonly ? "readonly " : ""}${getText(typeModel.value())}[]`;
    case "function":
      if (typeModel.alias) {
        return typeModel.alias;
      }
      return `(${Object.entries(typeModel.parameters)
        .map(([name, type]) => `${name}: ${getText(type)}`)
        .join(", ")}) => ${getText(typeModel.returnType)}`;
    case "object":
      if (typeModel.alias) {
        return typeModel.alias;
      }
      return `{${Object.entries(typeModel.value())
        .map(([name, type]) => `"${name}": ${getText(type)}`)
        .join("; ")}}`;
    case "union":
      if (typeModel.alias) {
        return typeModel.alias;
      }
      return typeModel
        .value()
        .map((type) => getText(type))
        .join(" | ");
    case "intersection":
      if (typeModel.alias) {
        return typeModel.alias;
      }
      return typeModel
        .value()
        .map((type) => getText(type))
        .join(" & ");
    case "unsupported":
      return typeModel.value();
  }
}

export function createTypeModelFromNode(node: Node): TypeModel {
  return createTypeModelFromType(node.getType(), node);
}

export function createTypeModelFromType(type: Type, node: Node): TypeModel {
  if (type.isNumber()) {
    return { kind: "number", original: type };
  } else if (type.isString()) {
    return { kind: "string", original: type };
  } else if (type.isBoolean()) {
    return { kind: "boolean", original: type };
  } else if (type.isBooleanLiteral()) {
    return { kind: "boolean-literal", value: type.getText() === "true", original: type };
  } else if (type.isNumberLiteral()) {
    return { kind: "number-literal", value: Number(type.getText()), original: type };
  } else if (type.isStringLiteral()) {
    return { kind: "string-literal", value: type.getText(), original: type };
  } else if (type.isNull()) {
    return { kind: "null", original: type };
  } else if (type.isNever()) {
    return { kind: "never", original: type };
  } else if (type.isUndefined()) {
    return { kind: "undefined", original: type };
  } else if (type.isAny()) {
    return { kind: "any", original: type };
  } else if (type.isUnknown()) {
    return { kind: "unknown", original: type };
  } else if (type.isTuple()) {
    const symbolName = type.getAliasSymbol()?.getName();

    const compilerType = type.getTargetType()?.compilerType;
    return {
      kind: "tuple",
      value: () => type.getTupleElements().map((t) => createTypeModelFromType(t, node)),
      readonly: compilerType && "readonly" in compilerType ? !!compilerType.readonly : false,
      alias: symbolName,
      original: type,
    };
  } else if (type.isArray()) {
    const symbolName = type.getAliasSymbol()?.getName();

    return {
      kind: "array",
      value: () => createTypeModelFromType(type.getTypeArguments()[0], node),
      readonly: type.isReadonlyArray(),
      alias: symbolName,
      original: type,
    };
  } else if (type.getCallSignatures().length > 0) {
    const firstCallSignature = type.getCallSignatures()[0];
    const symbolName = type.getAliasSymbol()?.getName();

    return {
      kind: "function",
      parameters: Object.fromEntries(
        firstCallSignature
          .getParameters()
          .map((p) => [p.getName(), createTypeModelFromType(p.getTypeAtLocation(node), node)])
      ),
      returnType: createTypeModelFromType(firstCallSignature.getReturnType(), node),
      alias: symbolName,
      original: type,
    };
  } else if (type.isObject()) {
    const symbolName = type.getSymbol()?.getName();

    const alias =
      type.getAliasSymbol()?.getName() ||
      (symbolName?.startsWith("{") || symbolName?.startsWith("__type") ? undefined : symbolName);
    return {
      kind: "object",
      value: () =>
        Object.fromEntries(
          type.getProperties().map((p) => [p.getName(), createTypeModelFromType(p.getTypeAtLocation(node), node)])
        ),
      alias,
      original: type,
    };
  } else if (type.isUnion()) {
    const symbolName = type.getAliasSymbol()?.getName();
    return {
      kind: "union",
      value: () => {
        const unionTypes = type.getUnionTypes();
        if (
          unionTypes.some((t) => (t.isBooleanLiteral() ? t.getText() === "true" : false)) &&
          unionTypes.some((t) => (t.isBooleanLiteral() ? t.getText() === "false" : false))
        ) {
          return [
            ...unionTypes
              .filter((t) => !t.isBooleanLiteral() && !t.isBoolean())
              .map((t) => createTypeModelFromType(t, node)),
            { kind: "boolean" },
          ];
        }
        return unionTypes.map((t) => createTypeModelFromType(t, node));
      },
      alias: symbolName,
      original: type,
    };
  } else if (type.isIntersection()) {
    const symbolName = type.getAliasSymbol()?.getName();
    return {
      kind: "intersection",
      value: () => {
        const typeModels = type.getIntersectionTypes().map((t) => createTypeModelFromType(t, node));

        const [objectTypeModels, otherTypeModels] = partition(typeModels, isObjectTypeModel);
        const [aliasedObjectTypeModels, nonAliasedObjectTypeModels] = partition(
          objectTypeModels,
          (t): t is ObjectTypeModel => !!t.alias
        );

        const mergedObjectTypeModels =
          nonAliasedObjectTypeModels.length > 1
            ? [
                nonAliasedObjectTypeModels.reduce((a, b) => {
                  const result = mergeObjectTypeModel(a, b);
                  if (result.kind === "intersection") {
                    throw new Error(`It cannot happen`);
                  }
                  return result;
                }),
              ]
            : [];

        return [...otherTypeModels, ...aliasedObjectTypeModels, ...mergedObjectTypeModels];
      },
      alias: symbolName,
      original: type,
    };
  } else {
    return { kind: "unsupported", value: () => type.getText() };
  }
}

function flattenUnionTypeModel(t1: TypeModel): TypeModel[] {
  if (t1.kind === "union") {
    const types = t1.value();
    return types.flatMap((t) => flattenUnionTypeModel(t));
  }
  return [t1];
}
export function unionTypeModel(t1: TypeModel, t2: TypeModel): UnionTypeModel {
  return {
    kind: "union",
    value: () => {
      const allTypes = [
        ...(t1.kind === "union" ? t1.value() : [t1]),
        ...(t2.kind === "union" ? t2.value() : [t2]),
      ].flatMap(flattenUnionTypeModel);

      return deduplicateTypes(allTypes);
    },
  };
}

export function deduplicateTypes(types: (TypeModel | null | undefined)[]): TypeModel[] {
  return [
    ...types
      .filter(isNotNil)
      .reduce((map, type) => {
        const typeText = getText(type);
        if (!map.has(typeText)) {
          map.set(typeText, type);
        }
        return map;
      }, new Map<string, TypeModel>())
      .values(),
  ];
}

export function mergeObjectTypeModel(
  t1: ObjectTypeModel,
  t2: ObjectTypeModel
): ObjectTypeModel | IntersectionTypeModel {
  if (!t1.alias && !t2.alias) {
    return {
      kind: "object",
      value: () => {
        const mergedObjectTypeModels = [t1, t2].reduce<Record<string, TypeModel>>(
          (acc, objectTypeModel: ObjectTypeModel) => {
            Object.entries(objectTypeModel.value()).forEach(([k, v]) => {
              acc[k] = v;
            });

            return acc;
          },
          {}
        );

        return mergedObjectTypeModels;
      },
    };
  }
  return { kind: "intersection", value: () => [t1, t2] };
}

export function getSupertype(typeWithNames: NonEmptyList<TypeModel>): TypeModel {
  return typeWithNames.reduce(getSuperTypeWithName);
}

function getSuperTypeWithName(t1: TypeModel, t2: TypeModel): TypeModel {
  if (t1.kind === "object" && !t1.alias) {
    if (t2.kind === "object" && !t2.alias) {
      return mergeObjectTypeModel(t1, t2);
    } else if (t2.kind === "intersection") {
      return {
        kind: "intersection",
        value: () => {
          const [firstType, secondType] = t2.value();
          return [firstType, getSuperTypeWithName(t1, secondType)];
        },
      };
    } else {
      return { kind: "intersection", value: () => [t1, t2] };
    }
  } else if (t1.kind === "intersection") {
    return {
      kind: "intersection",
      value: () => {
        const [firstType, secondType] = t1.value();
        return [firstType, getSuperTypeWithName(secondType, t2)];
      },
    };
  } else {
    return { kind: "intersection", value: () => [t1, t2] };
  }
}
