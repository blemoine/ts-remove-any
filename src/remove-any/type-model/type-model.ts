import { Node, Project, Type } from "ts-morph";
import { isNotNil } from "../../utils/is-not-nil";
import { deduplicate, partition } from "../../utils/array.utils";
import { NonEmptyList } from "../../utils/non-empty-list";
import { combineGuards } from "../../utils/type-guard.utils";
import { TypeEquation } from "../equation.model";
import * as crypto from "crypto";

export interface IntersectionTypeModel {
  kind: "intersection";
  value: () => TypeModel[];
  alias?: Alias;
  id?: string | undefined;
}
interface UnionTypeModel {
  kind: "union";
  value: () => TypeModel[];
  alias?: Alias;
  id?: string | undefined;
}
interface FunctionTypeModel {
  kind: "function";
  parameters: () => Record<string, TypeModel>;
  returnType: TypeModel;
  alias?: Alias;
  id?: string | undefined;
}
export interface ObjectTypeModel {
  kind: "object";
  value: () => Record<string, TypeModel>;
  alias?: Alias;
  id?: string | undefined;
}
export interface Alias {
  importPath: string | null;
  isDefault: boolean;
  name: string;
}

export interface SerializedTypeModel {
  imports: Alias[];
  name: string;
}

function isObjectTypeModel(typeModel: TypeModel): typeModel is ObjectTypeModel {
  return typeModel.kind === "object";
}

export type TypeModel =
  | { kind: "" }
  | { kind: "number" }
  | { kind: "number-literal"; value: number; alias?: Alias }
  | { kind: "string" }
  | { kind: "string-literal"; value: string; alias?: Alias }
  | { kind: "boolean" }
  | { kind: "boolean-literal"; value: boolean }
  | { kind: "unknown" }
  | { kind: "null" }
  | { kind: "any" }
  | { kind: "undefined" }
  | { kind: "never" }
  | { kind: "array"; value: () => TypeModel; readonly: boolean; alias?: Alias }
  | { kind: "tuple"; value: () => TypeModel[]; readonly: boolean; alias?: Alias }
  | FunctionTypeModel
  | ObjectTypeModel
  | UnionTypeModel
  | IntersectionTypeModel
  | { kind: "unsupported"; value: () => string; alias?: Alias };

export function getSerializedTypeModel(typeModel: TypeModel): SerializedTypeModel {
  if (!typeModel) {
    return { imports: [], name: "" };
  }

  switch (typeModel.kind) {
    case "":
    case "number":
    case "string":
    case "boolean":
    case "unknown":
    case "null":
    case "undefined":
    case "never":
    case "any":
      return { imports: [], name: typeModel.kind };
    case "number-literal": {
      const alias = typeModel.alias;
      if (alias) {
        return { imports: [alias], name: alias.name };
      }
      return { imports: [], name: `${typeModel.value}` };
    }
    case "string-literal": {
      const alias = typeModel.alias;

      if (alias) {
        return { imports: [alias], name: alias.name };
      }
      return { imports: [], name: typeModel.value };
    }
    case "boolean-literal":
      return { imports: [], name: `${typeModel.value}` };

    case "tuple": {
      const alias = typeModel.alias;
      if (alias) {
        return { imports: [alias], name: alias.name };
      } else {
        const readonly = typeModel.readonly;
        const typesInTuple = typeModel.value().map((t) => getSerializedTypeModel(t));

        return {
          imports: typesInTuple.flatMap((t) => t.imports),
          name: `${readonly ? "readonly " : ""}[${typesInTuple.map((t) => t.name).join(", ")}]`,
        };
      }
    }
    case "array": {
      const alias = typeModel.alias;
      if (alias) {
        return { imports: [alias], name: alias.name };
      } else {
        const readonly = typeModel.readonly;
        const typeInArray = getSerializedTypeModel(typeModel.value());

        return {
          imports: typeInArray.imports,
          name: `${readonly ? "readonly " : ""}${typeInArray.name}[]`,
        };
      }
    }
    case "function": {
      const alias = typeModel.alias;
      if (alias) {
        return { imports: [alias], name: alias.name };
      } else {
        const functionParameters = Object.entries(typeModel.parameters()).map(
          ([name, type]) => [name, getSerializedTypeModel(type)] as const
        );
        const functionReturnType = getSerializedTypeModel(typeModel.returnType);

        return {
          imports: [...functionParameters.flatMap(([, type]) => type.imports), ...functionReturnType.imports],
          name: `(${functionParameters.map(([name, type]) => `${name}: ${type.name}`).join(", ")}) => ${
            functionReturnType.name
          }`,
        };
      }
    }

    case "object": {
      const alias = typeModel.alias;
      if (alias) {
        return { imports: [alias], name: alias.name };
      } else {
        const objectAttributes = Object.entries(typeModel.value()).map(
          ([name, type]) => [name, getSerializedTypeModel(type)] as const
        );

        return {
          imports: objectAttributes.flatMap(([, type]) => type.imports),
          name: `{${objectAttributes.map(([name, type]) => `"${name}": ${type.name}`).join("; ")}}`,
        };
      }
    }
    case "union": {
      const alias = typeModel.alias;
      if (alias) {
        return { imports: [alias], name: alias.name };
      } else {
        const typesInUnion = typeModel.value().map((t) => getSerializedTypeModel(t));

        return {
          imports: typesInUnion.flatMap((t) => t.imports),
          name: typesInUnion
            .map((type) => {
              const text = type.name;
              if (text.includes("=>")) {
                return "(" + text + ")";
              }
              return text;
            })
            .join(" | "),
        };
      }
    }
    case "intersection": {
      const alias = typeModel.alias;
      if (alias) {
        return { imports: [alias], name: alias.name };
      } else {
        const typesInIntersection = typeModel.value().map((t) => getSerializedTypeModel(t));

        return {
          imports: typesInIntersection.flatMap((t) => t.imports),
          name: typesInIntersection
            .map((type) => {
              const text = type.name;
              if (text.includes("=>")) {
                return "(" + text + ")";
              }
              return text;
            })
            .join(" & "),
        };
      }
    }
    case "unsupported": {
      const alias = typeModel.alias;
      if (alias) {
        return { imports: [alias], name: alias.name };
      } else {
        return { imports: [], name: typeModel.value() };
      }
    }
  }
}

export function createTypeModelFromNode(node: Node): TypeModel {
  return createTypeModelFromType(node.getType(), node);
}

function createIntersectionModels(typeModels: TypeModel[]) {
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

  return deduplicateTypes([...otherTypeModels, ...aliasedObjectTypeModels, ...mergedObjectTypeModels]);
}

function getAlias(type: Type, project: Project): Alias | undefined {
  const typeText = type.getText();

  const importsValues = typeText.match(/import\("(.+?)"\)(\.[a-zA-Z0-9-_.]+)/);
  let importPath: string | null;
  let name: string;
  let isDefault: boolean;

  if (importsValues) {
    const rootDir = project.getCompilerOptions().rootDir;
    const projectDir = rootDir ? project.getDirectory(rootDir)?.getPath() : null;

    importPath = importsValues[1].replace(projectDir ?? "", "").replace(/^\/node_modules\//, "");
    if (importPath.endsWith("/index")) {
      importPath = importPath.slice(0, -"/index".length);
    }
    if (importPath.startsWith("@types/")) {
      importPath = importPath.slice("@types/".length);
    }
    name = importsValues[2].slice(1); // removing the starting '.'

    if (name === "default" && !importsValues[3]) {
      isDefault = true;

      const declarations = type.getSymbol()?.getDeclarations();
      let defaultName = declarations
        ?.find(
          combineGuards(
            combineGuards(Node.isInterfaceDeclaration, Node.isTypeAliasDeclaration),
            Node.isClassDeclaration
          )
        )
        ?.getName();
      if (!defaultName && declarations) {
        const typeLiteral = declarations.find(Node.isTypeLiteral);
        if (typeLiteral) {
          const parent = typeLiteral.getParent();
          if (Node.isTypeAliasDeclaration(parent)) {
            defaultName = parent.getName();
          }
        }
      }

      name = defaultName ?? sanitizeForName(importPath);
    } else {
      isDefault = false;
    }
  } else {
    importPath = null;
    name = typeText;
    isDefault = false;
  }

  return { importPath, name, isDefault };
}

function sanitizeForName(str: string): string {
  return (str.split("/").at(-1) ?? "RANDOM_NAME").replace(/[^a-zA-Z0-9_]/g, "");
}

export function createTypeModelFromType(type: Type, node: Node): TypeModel {
  const project = node.getProject();
  const compilerId =
    "id" in type.compilerType && typeof type.compilerType.id === "number" ? `${type.compilerType.id}` : undefined;

  if (type.isNumber()) {
    return { kind: "number" };
  } else if (type.isString()) {
    return { kind: "string" };
  } else if (type.isBoolean()) {
    return { kind: "boolean" };
  } else if (type.isBooleanLiteral()) {
    return { kind: "boolean-literal", value: type.getText() === "true" };
  } else if (type.isNumberLiteral()) {
    const alias = getAlias(type, project);

    return {
      kind: "number-literal",
      value: Number(type.getText()),
      alias: alias?.importPath ? alias : undefined,
    };
  } else if (type.isStringLiteral()) {
    const alias = getAlias(type, project);

    return {
      kind: "string-literal",
      value: type.getText(),
      alias: alias?.importPath ? alias : undefined,
    };
  } else if (type.isNull()) {
    return { kind: "null" };
  } else if (type.isNever()) {
    return { kind: "never" };
  } else if (type.isUndefined()) {
    return { kind: "undefined" };
  } else if (type.isAny()) {
    return { kind: "any" };
  } else if (type.isUnknown()) {
    return { kind: "unknown" };
  } else if (type.isTuple()) {
    const symbolName = type.getAliasSymbol()?.getFullyQualifiedName();

    const compilerType = type.getTargetType()?.compilerType;
    return {
      kind: "tuple",
      value: () => type.getTupleElements().map((t) => createTypeModelFromType(t, node)),
      readonly: compilerType && "readonly" in compilerType ? !!compilerType.readonly : false,
      alias: symbolName ? { name: symbolName, isDefault: false, importPath: null } : undefined,
    };
  } else if (type.isArray()) {
    const symbolName = type.getAliasSymbol()?.getFullyQualifiedName();

    return {
      kind: "array",
      value: () => createTypeModelFromType(type.getTypeArguments()[0], node),
      readonly: type.isReadonlyArray(),
      alias: symbolName ? { name: symbolName, isDefault: false, importPath: null } : undefined,
    };
  } else if (type.getCallSignatures().length > 0) {
    const firstCallSignature = type.getCallSignatures()[0];
    const symbolName = type.getAliasSymbol()?.getFullyQualifiedName();

    return {
      kind: "function",
      parameters: () =>
        Object.fromEntries(
          firstCallSignature
            .getParameters()
            .map((p) => [p.getName(), createTypeModelFromType(p.getTypeAtLocation(node), node)])
        ),
      returnType: createTypeModelFromType(firstCallSignature.getReturnType(), node),
      alias: symbolName ? { importPath: null, isDefault: false, name: symbolName } : undefined,
      id: compilerId,
    };
  } else if (type.isObject()) {
    const alias = getAlias(type, project);
    if (type.getProperties().length > 25) {
      // we have a stack problem here

      return { kind: "unsupported", value: () => type.getText(), alias };
    }

    return {
      kind: "object",
      value: () =>
        Object.fromEntries(
          type.getProperties().map((p) => [p.getName(), createTypeModelFromType(p.getTypeAtLocation(node), node)])
        ),
      alias: alias?.name?.startsWith("{") ? undefined : alias,
      id: compilerId,
    };
  } else if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    if (unionTypes.length === 1) {
      return createTypeModelFromType(unionTypes[0], node);
    }
    const alias = getAlias(type, project);

    return {
      kind: "union",
      value: () => {
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
      alias: alias?.name?.startsWith("{") ? undefined : alias,
      id: compilerId,
    };
  } else if (type.isIntersection()) {
    const intersectionTypes = type.getIntersectionTypes();
    if (intersectionTypes.length === 1) {
      return createTypeModelFromType(intersectionTypes[0], node);
    }
    const alias = getAlias(type, project);

    return {
      kind: "intersection",
      value: () => {
        const typeModels = type.getIntersectionTypes().map((t) => createTypeModelFromType(t, node));
        return createIntersectionModels(typeModels);
      },
      alias: alias?.name?.startsWith("{") ? undefined : alias,
      id: compilerId,
    };
  } else {
    const alias = getAlias(type, project);
    return { kind: "unsupported", value: () => type.getText(), alias };
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

function deduplicateTypes(types: (TypeModel | null | undefined)[]): TypeModel[] {
  return deduplicate(types.filter(isNotNil), (type: TypeModel) => {
    if ("id" in type && !!type.id) {
      return type.id;
    }
    if (type.kind === "intersection" || type.kind === "union") {
      if (!type.alias) {
        // TODO probably better to try to find the id from the original type if possible
        return crypto.randomUUID();
      }
    }

    return JSON.stringify(getSerializedTypeModel(type));
  });
}

export function deduplicateTypesEquations(types: (TypeEquation | null | undefined)[]): TypeEquation[] {
  function getEquationKey(equation: TypeEquation): string {
    if ("id" in equation.type && !!equation.type.id) {
      return equation.type.id;
    }
    return JSON.stringify(getSerializedTypeModel(equation.type));
  }
  return types.reduce<TypeEquation[]>((acc, equation) => {
    if (!equation || !equation.type) {
      return acc;
    }

    const key = JSON.stringify(getSerializedTypeModel(equation.type));
    const existingEquation = acc.find((existingEquation) => getEquationKey(existingEquation) === key);
    if (!existingEquation) {
      acc.push(equation);
    } else {
      if (existingEquation.relation !== "equal") {
        if (
          equation.relation === "equal" ||
          (equation.relation === "subtype" && existingEquation.relation === "supertype") ||
          (equation.relation === "supertype" && existingEquation.relation === "subtype")
        ) {
          return acc.filter((existingEquation) => getEquationKey(existingEquation) === key).concat(equation);
        }
      }
    }

    return acc;
  }, []);
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
  if (typeWithNames.length === 1) {
    return typeWithNames[0];
  }
  return typeWithNames.reduce(getSuperTypeWithName);
}

function getSuperTypeWithName(t1: TypeModel, t2: TypeModel): TypeModel {
  const t1Id = "id" in t1 && t1.id ? t1.id : undefined;
  const t2Id = "id" in t2 && t2.id ? t2.id : undefined;

  if (t1.kind === "object" && !t1.alias) {
    if (t2.kind === "object" && !t2.alias) {
      return mergeObjectTypeModel(t1, t2);
    } else if (t2.kind === "intersection") {
      return {
        kind: "intersection",
        value: () => {
          const t2Values = t2.value();
          if (t2Values.length === 0) {
            return [t1];
          }
          if (t2Values.length === 1) {
            return [getSuperTypeWithName(t1, t2Values[0])];
          }
          const [firstType, secondType] = t2Values;
          return createIntersectionModels([firstType, getSuperTypeWithName(t1, secondType)]);
        },
        id: t1Id && t2Id ? t1Id + "::" + t2Id : undefined,
      };
    } else {
      return {
        kind: "intersection",
        value: () => createIntersectionModels([t1, t2]),
        id: t1Id && t2Id ? t1Id + "::" + t2Id : undefined,
      };
    }
  } else if (t1.kind === "intersection") {
    return {
      kind: "intersection",
      value: () => {
        const t1Values = t1.value();
        if (t1Values.length === 0) {
          return [t2];
        }
        if (t1Values.length === 1) {
          return [getSuperTypeWithName(t1Values[0], t2)];
        }
        const [firstType, secondType] = t1Values;
        return createIntersectionModels([firstType, getSuperTypeWithName(secondType, t2)]);
      },
      id: t1Id && t2Id ? t1Id + "::" + t2Id : undefined,
    };
  } else if (t1.kind === "union" && t2.kind === "union") {
    return {
      kind: "union",
      value: () => deduplicateTypes([...t1.value(), ...t2.value()]),
    };
  } else {
    return {
      kind: "intersection",
      value: () => createIntersectionModels([t1, t2]),
      id: t1Id && t2Id ? t1Id + "::" + t2Id : undefined,
    };
  }
}
