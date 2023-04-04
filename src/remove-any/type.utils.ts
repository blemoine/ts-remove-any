import {
  ArrowFunction,
  CallExpression,
  FunctionDeclaration,
  JsxOpeningElement,
  JsxSelfClosingElement,
  NewExpression,
  Node,
  ParameterDeclaration,
  StructureKind,
  Type,
  TypedNode,
} from "ts-morph";
import { isNotNil } from "../utils/is-not-nil";
import { RevertableOperation } from "./revert-operation";
import {
  createTypeModelFromNode,
  createTypeModelFromType,
  getSerializedTypeModel,
  SerializedTypeModel,
  TypeModel,
  unionTypeModel,
} from "./type-model/type-model";
import { allTypesOfRefs } from "./type-unifier";

export function isImplicitAny(node: TypedNode & Node): boolean {
  const declaredType = node.getTypeNode();
  return isAny(node) && !declaredType;
}

export function isAny(node: TypedNode & Node): boolean {
  return node.getType().isAny();
}

export function isAnyArray(node: TypedNode & Node): boolean {
  return (
    node.getType().isArray() &&
    node
      .getType()
      .getTypeArguments()
      .some((t) => t.getText() === "any" || t.getText() === "never")
  );
}

export function isImplicitAnyArray(node: TypedNode & Node) {
  const declaredType = node.getTypeNode();
  return isAnyArray(node) && !declaredType;
}

export function filterUnusableTypes(typesFromRefs: TypesFromRefs[]): TypesFromRefs {
  const types = typesFromRefs.flatMap(({ types }) =>
    types.filter(isNotNil).filter((t) => {
      const text = getSerializedTypeModel(t).name;

      if ("alias" in t && !!t.alias && text.startsWith('"')) {
        return false;
      }
      return (
        t.kind !== "any" &&
        !text.includes("any[]") &&
        !text.includes("(any)") &&
        !text.includes("<any") &&
        !text.includes("any>") &&
        !text.includes(" any,") &&
        !text.includes(": any") &&
        t.kind !== "never" &&
        !text.includes("never[]") &&
        !text.includes(": never")
      );
    })
  );

  return { types };
}

function computeTypesFromList(callsiteTypes: TypeModel[]): SerializedTypeModel | null {
  if (callsiteTypes.length === 0) {
    return null;
  }
  if (callsiteTypes.every((s) => s.kind === "boolean" || s.kind === "boolean-literal")) {
    return { imports: [], name: "boolean" };
  }

  if (callsiteTypes.length <= 4) {
    if (
      callsiteTypes.every((t) => t.kind === "number" || t.kind === "number-literal") &&
      callsiteTypes.some((t) => t.kind === "number")
    ) {
      return { imports: [], name: "number" };
    }
    if (
      callsiteTypes.every((t) => t.kind === "string" || t.kind === "string-literal") &&
      callsiteTypes.some((t) => t.kind === "string")
    ) {
      return { imports: [], name: "string" };
    }

    return getSerializedTypeModel(callsiteTypes.reduce(unionTypeModel));
  }

  if (callsiteTypes.every((t) => t.kind === "number" || t.kind === "number-literal")) {
    return { imports: [], name: "number" };
  } else if (callsiteTypes.every((t) => t.kind === "string" || t.kind === "string-literal")) {
    return { imports: [], name: "string" };
  }
  return null;
}

export function computeTypesFromRefs({ types }: TypesFromRefs): SerializedTypeModel | null {
  return computeTypesFromList(types);
}

export interface TypesFromRefs {
  types: TypeModel[];
}

export function findTypeFromRefUsage(ref: Node): TypesFromRefs {
  const parent = ref.getParent();
  if (Node.isBinaryExpression(parent)) {
    const operator = parent.getOperatorToken().getText();
    if (operator === "??" || operator === "||") {
      const left = parent.getLeft();
      const right = parent.getRight();

      const types = [createTypeModelFromNode(left), createTypeModelFromNode(right)].map<TypeModel>((t) => {
        if (t.kind === "boolean-literal") {
          return { kind: "boolean" };
        } else if (t.kind === "number-literal") {
          return { kind: "number" };
        } else if (t.kind === "string-literal") {
          return { kind: "string" };
        } else {
          return { kind: "" };
        }
      });
      return {
        types: [{ kind: "union", value: () => [...types, { kind: "null" as const }, { kind: "undefined" as const }] }],
      };
    }
  }
  if (Node.isJsxExpression(parent)) {
    const jsxAttribute = parent.getParent();
    if (Node.isJsxAttribute(jsxAttribute)) {
      return {
        types: jsxAttribute
          .findReferencesAsNodes()
          .map((r) => {
            const jsxParent = r.getParent();
            if (Node.isPropertySignature(jsxParent)) {
              return createTypeModelFromNode(jsxParent);
            }
            return null;
          })
          .filter(isNotNil),
      };
    }
  }
  if (Node.isReturnStatement(parent)) {
    const closestFunctionDeclaration = parent
      .getAncestors()
      .find((a): a is ArrowFunction | FunctionDeclaration => Node.isArrowFunction(a) || Node.isFunctionDeclaration(a));
    if (closestFunctionDeclaration) {
      return {
        types: [createTypeModelFromType(closestFunctionDeclaration.getReturnType(), ref)],
      };
    }
  }
  if (Node.isVariableDeclaration(parent)) {
    const declarations = parent.getVariableStatement()?.getDeclarations();

    return {
      types: (declarations ?? [])?.map((d) => createTypeModelFromNode(d)),
    };
  }
  const typeOfVariableCall = findTypeOfVariableCall(ref);
  return {
    types: typeOfVariableCall ? [createTypeModelFromType(typeOfVariableCall, ref)] : [],
  };
}

export function computeDestructuredTypes(parametersFn: ParameterDeclaration): SerializedTypeModel | null {
  if (parametersFn.getTypeNode()) {
    return null;
  }
  const parameterTypeProperties = parametersFn.getType().getProperties();
  if (parameterTypeProperties.some((p) => p.getTypeAtLocation(parametersFn).isAny())) {
    const propertyTypePairs = parametersFn.getChildren().flatMap((child) => {
      if (Node.isObjectBindingPattern(child)) {
        return child
          .getElements()
          .map((element) => {
            if (!element.getType().isAny()) {
              return null;
            }

            const typesFromUsage = element.findReferencesAsNodes().flatMap((ref) => {
              if (Node.isReferenceFindable(ref)) {
                return { types: [...allTypesOfRefs(ref).types, ...findTypeFromRefUsage(ref).types] };
              }
              return { types: [] };
            });

            const type = computeTypesFromRefs(filterUnusableTypes(typesFromUsage));

            const propertyName = element.getPropertyNameNode()?.getText() ?? element.getName();

            return type ? ({ propertyName, type } as const) : null;
          })
          .filter(isNotNil);
      }
      return [];
    });

    if (propertyTypePairs.length > 0) {
      return {
        name: `{${propertyTypePairs
          .map(({ propertyName, type }) => {
            return `${propertyName}: ${type.name}`;
          })
          .join(",")}}`,
        imports: propertyTypePairs.flatMap(({ type }) => type.imports),
      };
    }
  }
  return null;
}

/**
 * In expression `fn(x)` or `obj.fn(x)` type of the argument of `fn`
 *
 * @param ref
 */
function findTypeOfVariableCall(ref: Node): Type | null {
  const parent = ref.getParent();
  if (!Node.isCallExpression(parent)) {
    return null;
  }
  const idxOfCallParameter = parent.getArguments().indexOf(ref);
  const functionDeclaredParametersTypes = getParameterTypesFromCallerSignature(parent);
  return functionDeclaredParametersTypes && functionDeclaredParametersTypes[idxOfCallParameter]?.type
    ? functionDeclaredParametersTypes[idxOfCallParameter].type
    : null;
}

export function getParameterTypesFromCallerSignature(callExpression: CallExpression | NewExpression): TypeOrSpread[] {
  const functionItself = callExpression.getExpression();

  if (Node.isIdentifier(functionItself) || Node.isPropertyAccessExpression(functionItself)) {
    return getParametersOfCallSignature(functionItself);
  }

  return [];
}

export function getPropsTypeOfJsx(jsxTagNamedNode: JsxSelfClosingElement | JsxOpeningElement): Type | null {
  const signatures = jsxTagNamedNode.getTagNameNode().getType().getCallSignatures();
  if (signatures.length > 0) {
    const parameters = signatures[0].getParameters(); // There should be only one parameters: the props
    if (parameters.length > 0) {
      const propsDefinition = parameters[0];
      return propsDefinition.getTypeAtLocation(jsxTagNamedNode);
    }
  }
  return null;
}

export function getPropsTypeOfJsxElement(
  jsxTagNamedNode: JsxSelfClosingElement | JsxOpeningElement
): Record<string, Type> {
  const propsType = getPropsTypeOfJsx(jsxTagNamedNode);
  if (!propsType) {
    return {};
  }
  const propertiesOfProps = propsType.getProperties();

  return Object.fromEntries(
    propertiesOfProps.map((p) => {
      return [p.getName(), p.getTypeAtLocation(jsxTagNamedNode)] as const;
    })
  );
}

type TypeOrSpread = { kind: "type"; type: Type } | { kind: "spread"; type: Type };

// if node has a type of something callable, get the parameters of the type associated
// could be a function, an arrow function, a method
// eg. `n: (a: string, b:number) => void`  => [string, number]
export function getParametersOfCallSignature(node: Node): TypeOrSpread[] {
  const signatures = node.getType().getCallSignatures();
  if (signatures?.length > 0) {
    const parameters = signatures[0].getParameters();
    return parameters.map((p) => {
      const typeAtLocation = p.getTypeAtLocation(node);
      const valueDeclaration = p.getValueDeclaration();
      if (
        Node.isParameterDeclaration(valueDeclaration) &&
        valueDeclaration.getDotDotDotToken() &&
        typeAtLocation.isArray()
      ) {
        return { kind: "spread", type: typeAtLocation.getTypeArguments()[0] };
      }
      return { kind: "type", type: typeAtLocation };
    });
  }
  return [];
}

export type ComputedType =
  | { kind: "type_found"; type: SerializedTypeModel }
  | { kind: "no_any" }
  | { kind: "no_type_found" };

export function setTypeOnNode(node: TypedNode & Node, newTypes: SerializedTypeModel): RevertableOperation {
  const sourceFile = node.getSourceFile();
  const nodeDeclaredType = node.getTypeNode()?.getText();
  try {
    const addedImports: { moduleSpecifier: string; name: string; isDefault: boolean; isNew: boolean }[] = [];
    let typeName = newTypes.name;

    newTypes.imports.forEach((newType) => {
      const importValueName = newType.name.split(".")[0];

      if (!newType.importPath || (newType.isDefault && !newType.name)) {
        node.setType(newType.name);
      } else {
        const importName = newType.importPath;

        const project = sourceFile.getProject();
        const rootDir = project.getCompilerOptions().rootDir;
        const projectDir = rootDir ? project.getDirectory(rootDir)?.getPath() : null;

        const moduleSpecifier = projectDir ? importName.replace(projectDir, "") : importName;

        const existingImport = sourceFile.getImportDeclaration((d) => {
          return d.getModuleSpecifier().getLiteralValue() === moduleSpecifier;
        });

        if (!existingImport) {
          const importStructure = {
            moduleSpecifier,
            isTypeOnly: true,
            defaultImport: newType.isDefault ? importValueName : undefined,
            kind: StructureKind.ImportDeclaration,
            namedImports: newType.isDefault ? undefined : [importValueName],
          } as const;

          addedImports.push({
            moduleSpecifier,
            isDefault: newType.isDefault,
            name: importValueName,
            isNew: true,
          });

          sourceFile.addImportDeclaration(importStructure);
        } else {
          if (!newType.isDefault) {
            if (!existingImport.getNamedImports().some((i) => i.getName() === importValueName)) {
              existingImport.addNamedImport(importValueName);
              addedImports.push({
                moduleSpecifier,
                isDefault: newType.isDefault,
                name: importValueName,
                isNew: false,
              });
            }
          } else {
            const defaultImportName = existingImport.getDefaultImport()?.getText();

            if (defaultImportName) {
              typeName = defaultImportName;
            } else {
              existingImport.setDefaultImport(importValueName);
              addedImports.push({
                moduleSpecifier,
                isDefault: true,
                name: importValueName,
                isNew: false,
              });
            }
          }
        }
      }
    });
    node.setType(typeName);

    return {
      countChangesDone: 1,
      countOfAnys: 1,
      revert() {
        if (nodeDeclaredType) {
          node.setType(nodeDeclaredType);
        } else {
          node.removeType();
        }

        addedImports.forEach((addedImport) => {
          const importDeclarations = sourceFile.getImportDeclarations();
          importDeclarations.forEach((importDeclaration) => {
            const importModuleSpecifier = importDeclaration.getModuleSpecifier().getLiteralValue();
            if (importModuleSpecifier === addedImport?.moduleSpecifier) {
              if (addedImport.isDefault) {
                if (importDeclaration.getNamedImports().length > 0) {
                  importDeclaration.setDefaultImport("");
                } else {
                  importDeclaration.remove();
                }
              } else {
                importDeclaration.getNamedImports().forEach((namedImport) => {
                  if (namedImport.getName() === addedImport?.name) {
                    namedImport.remove();
                  }
                });
                if (
                  importDeclaration.getNamedImports().length === 0 &&
                  addedImports.some((i) => i.isNew && i.moduleSpecifier === importModuleSpecifier)
                ) {
                  importDeclaration.remove();
                }
              }
            }
          });
        });
      },
    };
  } catch (e) {
    console.error(`Error in source file ${sourceFile.getBaseName()}`, e);
    throw e;
  }
}
