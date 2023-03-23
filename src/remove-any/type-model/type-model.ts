import { Type, Node } from "ts-morph";
import { TypeWithName } from "../fake-type.utils";
import { isNotNil } from "../../utils/is-not-nil";

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
  | {
      kind: "function";
      parameters: Record<string, TypeModel>;
      returnType: TypeModel;
      alias?: string;
      original?: Type;
    }
  | { kind: "object"; value: () => Record<string, TypeModel>; alias?: string; original?: Type }
  | { kind: "union"; value: () => TypeModel[]; alias?: string; original?: Type }
  | { kind: "intersection"; value: () => TypeModel[]; alias?: string; original?: Type }
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

export function createTypeModelFromTypeWithName(typeWithName: TypeWithName): TypeModel {
  if ("literal" in typeWithName) {
    return {
      kind: "object",
      value: () =>
        Object.fromEntries(
          Object.entries(typeWithName.literal).map(([k, v]) => [k, createTypeModelFromTypeWithName(v)])
        ),
    };
  } else if ("and" in typeWithName) {
    return { kind: "union", value: () => typeWithName.and.map((t) => createTypeModelFromTypeWithName(t)) };
  } else {
    return typeWithName;
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
    const compilerType = type.getTargetType()?.compilerType;
    return {
      kind: "tuple",
      value: () => type.getTupleElements().map((t) => createTypeModelFromType(t, node)),
      readonly: compilerType && "readonly" in compilerType ? !!compilerType.readonly : false,
      original: type,
    };
  } else if (type.isArray()) {
    return {
      kind: "array",
      value: () => createTypeModelFromType(type.getTypeArguments()[0], node),
      readonly: type.isReadonlyArray(),
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
      value: () => type.getIntersectionTypes().map((t) => createTypeModelFromType(t, node)),
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
export function unionTypeModel(t1: TypeModel, t2: TypeModel): TypeModel {
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
