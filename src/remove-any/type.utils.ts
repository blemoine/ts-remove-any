import {
  ArrowFunction,
  FunctionDeclaration,
  Identifier,
  Node,
  ParameterDeclaration,
  PropertyAccessExpression,
  Type,
  TypedNode,
} from "ts-morph";
import { isNotNil } from "../utils/is-not-nil";
import { RevertableOperation } from "./revert-operation";

export function isImplicitAny(node: TypedNode & Node) {
  const isAny = node.getType().isAny();
  const declaredType = node.getTypeNode();
  return isAny && !declaredType;
}

export function isImplicitAnyArray(node: TypedNode & Node) {
  const isAnyArray =
    node.getType().isArray() &&
    node
      .getType()
      .getTypeArguments()
      .some((t) => t.getText() === "any");
  const declaredType = node.getTypeNode();
  return isAnyArray && !declaredType;
}

export function filterUnusableTypes(types: (Type | null | undefined)[]): Type[] {
  return types.filter(isNotNil).filter((t) => {
    const text = t.getText();
    return (
      !t.isAny() &&
      !text.includes("any[]") &&
      !text.includes("<any") &&
      !text.includes("any>") &&
      !text.includes(" any,") &&
      !text.includes(": any") &&
      !text.includes("import(") &&
      !t.isNever() &&
      !text.includes("never[]") &&
      !text.includes(": never")
    );
  });
}

export function computeTypesFromList(callsiteTypes: Type[]): string | null {
  if (callsiteTypes.length === 0) {
    return null;
  }
  if (callsiteTypes.every((s) => s.isBooleanLiteral() || s.isBoolean())) {
    return "boolean";
  }
  if (callsiteTypes.length === 1) {
    return callsiteTypes[0].getText();
  }
  if (callsiteTypes.length <= 4) {
    if (callsiteTypes.every((t) => t.isNumber() || t.isNumberLiteral()) && callsiteTypes.some((t) => t.isNumber())) {
      return "number";
    }
    if (callsiteTypes.every((t) => t.isString() || t.isStringLiteral()) && callsiteTypes.some((t) => t.isString())) {
      return "string";
    }

    const newTypes = [...new Set(callsiteTypes.map((t) => t.getText()))];
    return newTypes.join(" | ");
  }

  if (callsiteTypes.every((t) => t.isNumber() || t.isNumberLiteral())) {
    return "number";
  } else if (callsiteTypes.every((t) => t.isString() || t.isStringLiteral())) {
    return "string";
  }
  return null;
}

export function findTypeFromRefUsage(ref: Node): Type[] {
  const parent = ref.getParent();
  if (Node.isReturnStatement(parent)) {
    const closestFunctionDeclaration = parent
      .getAncestors()
      .find((a): a is ArrowFunction | FunctionDeclaration => Node.isArrowFunction(a) || Node.isFunctionDeclaration(a));
    if (closestFunctionDeclaration) {
      return [closestFunctionDeclaration.getReturnType()];
    }
  }
  if (Node.isVariableDeclaration(parent)) {
    const declarations = parent.getVariableStatement()?.getDeclarations();

    return (declarations ?? [])?.map((d) => d.getType());
  }
  return findTypeOfVariableCall(ref) ?? [];
}

export function computeDestructuredTypes(parametersFn: ParameterDeclaration): string | null {
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
              return findTypeFromRefUsage(ref);
            });
            const type = computeTypesFromList(filterUnusableTypes(typesFromUsage));

            return type ? ({ propertyName: element.getName(), type } as const) : null;
          })
          .filter(isNotNil);
      }
      return [];
    });

    if (propertyTypePairs.length > 0) {
      return `{${propertyTypePairs
        .map(({ propertyName, type }) => {
          return `${propertyName}: ${type}`;
        })
        .join(",")}}`;
    }
  }
  return null;
}

/**
 * In expression `fn(x)` or `obj.fn(x)` type of the argument of `fn`
 *
 * @param ref
 */
function findTypeOfVariableCall(ref: Node): Type[] | null {
  const parent = ref.getParent();
  if (!parent) {
    return null;
  }
  if (!Node.isCallExpression(parent)) {
    return null;
  }
  const children = parent.getChildren();
  if (children.length === 0) {
    return null;
  }

  const firstChildren = children[0];
  const idxOfCallParameter = parent.getArguments().indexOf(ref);

  if (firstChildren instanceof Identifier || firstChildren instanceof PropertyAccessExpression) {
    return firstChildren
      .getType()
      .getCallSignatures()
      .map((signature) => {
        const parameters = signature.getParameters();

        return parameters[idxOfCallParameter]?.getTypeAtLocation(firstChildren);
      });
  }

  return null;
}

export type ComputedType = { kind: "type_found"; type: string } | { kind: "no_any" } | { kind: "no_type_found" };

export function setTypeOnNode(node: TypedNode, newType: string): RevertableOperation {
  node.setType(newType);
  return {
    countChangesDone: 1,
    countOfAnys: 1,
    revert() {
      node.removeType();
    },
  };
}
