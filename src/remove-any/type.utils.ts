import {
  ArrowFunction,
  FunctionDeclaration,
  Identifier,
  Node,
  ParameterDeclaration,
  PropertyAccessExpression,
  ReferenceFindableNode,
  Type,
  TypedNode,
  VariableDeclaration,
} from "ts-morph";
import { isNotNil } from "../utils/is-not-nil";

export function isImplicitAny(node: TypedNode & Node) {
  const isAny = node.getType().isAny();
  const declaredType = node.getTypeNode();
  return isAny && !declaredType;
}

export function filterUnusableTypes(types: (Type | null | undefined)[]): Type[] {
  return types.filter(isNotNil).filter((t) => {
    const text = t.getText();
    return (
      !t.isAny() &&
      !text.includes("any[]") &&
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

export function findTypesFromCallSite(
  node: { getName?: () => string | undefined } & ReferenceFindableNode,
  parametersIdx: number
): Type[] {
  const sourceName = "getName" in node && node.getName ? node.getName() : undefined;
  return node.findReferencesAsNodes().flatMap((ref): Type[] => {
    const parent = ref.getParent();

    if (Node.isNewExpression(parent)) {
      const argument = parent.getArguments()[parametersIdx];
      return [argument?.getType()];
    }
    if (Node.isPropertyAccessExpression(parent)) {
      const greatParent = parent.getParent();
      if (Node.isCallExpression(greatParent)) {
        const argument = greatParent.getArguments()[parametersIdx];
        return [argument?.getType()];
      }
    }
    if (Node.isCallExpression(parent)) {
      if (sourceName && parent.getText().startsWith(sourceName)) {
        const argument = parent.getArguments()[parametersIdx];
        return [argument?.getType()];
      }
      const children = parent.getChildren();
      if (children.length > 0) {
        const firstChildren = children[0];

        if (firstChildren instanceof Identifier) {
          return firstChildren
            .getType()
            .getCallSignatures()
            .map((s) => s.getParameters()[parametersIdx]?.getTypeAtLocation(firstChildren));
        }
        if (firstChildren instanceof PropertyAccessExpression) {
          const idxOfCallParameter = parent.getArguments().indexOf(ref);

          return firstChildren
            .getType()
            .getCallSignatures()
            .flatMap((signature) => {
              const parameters = signature.getParameters();
              return parameters[idxOfCallParameter]
                ?.getTypeAtLocation(firstChildren)
                .getCallSignatures()
                .map((s) => s.getParameters()[parametersIdx]?.getTypeAtLocation(firstChildren));
            });
        }
      }

      return [];
    }
    return [];
  });
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

export function findTypesOfVariableUsage(variableDeclaration: VariableDeclaration): Type[] {
  return variableDeclaration
    .findReferencesAsNodes()
    .flatMap((ref) => {
      const variableAssignment = findTypeOfVariableAssignment(ref);
      if (variableAssignment) {
        return [variableAssignment];
      }

      return findTypeOfVariableCall(ref);
    })
    .filter(isNotNil);
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

/**
 * In `x = y` expression, type of `y`
 * @param ref
 */
function findTypeOfVariableAssignment(ref: Node): Type | null {
  const parent = ref.getParent();
  if (!parent) {
    return null;
  }
  if (!Node.isBinaryExpression(parent)) {
    return null;
  }
  if (parent.getOperatorToken().getText() !== "=") {
    return null;
  }

  return parent.getRight().getType() ?? null;
}

export type ComputedType = { kind: "type_found"; type: string } | { kind: "no_any" } | { kind: "no_type_found" };
