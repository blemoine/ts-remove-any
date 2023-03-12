import {
  ArrowFunction,
  CallExpression,
  FunctionDeclaration,
  JsxOpeningElement,
  JsxSelfClosingElement,
  NewExpression,
  Node,
  ParameterDeclaration,
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

export function filterUnusableTypes(typesFromRefs: TypesFromRefs[]): TypesFromRefs {
  const types = typesFromRefs.flatMap(({ types }) =>
    types.filter(isNotNil).filter((t) => {
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
    })
  );
  const nullable = typesFromRefs.some((t) => t.nullable);
  return { types, nullable };
}

function computeTypesFromList(callsiteTypes: Type[]): string | null {
  if (callsiteTypes.length === 0) {
    return null;
  }
  if (callsiteTypes.every((s) => s.isBooleanLiteral() || s.isBoolean())) {
    return "boolean";
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

export function computeTypesFromRefs({ nullable: isNullable, types: callsiteTypes }: TypesFromRefs): string | null {
  const resultTypes = computeTypesFromList(callsiteTypes);

  if (isNullable && resultTypes) {
    return resultTypes + " | null | undefined";
  }
  return resultTypes;
}

interface TypesFromRefs {
  types: Type[];
  nullable: boolean;
}

export function findTypeFromRefUsage(ref: Node): TypesFromRefs {
  const parent = ref.getParent();
  if (Node.isBinaryExpression(parent)) {
    const operator = parent.getOperatorToken().getText();
    if (operator === "??" || operator === "||") {
      const left = parent.getLeft();
      const right = parent.getRight();

      return { types: [left.getType(), right.getType()].map((t) => t.getBaseTypeOfLiteralType()), nullable: true };
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
              return jsxParent.getType();
            }
            return null;
          })
          .filter(isNotNil),
        nullable: false,
      };
    }
  }
  if (Node.isReturnStatement(parent)) {
    const closestFunctionDeclaration = parent
      .getAncestors()
      .find((a): a is ArrowFunction | FunctionDeclaration => Node.isArrowFunction(a) || Node.isFunctionDeclaration(a));
    if (closestFunctionDeclaration) {
      return { types: [closestFunctionDeclaration.getReturnType()], nullable: false };
    }
  }
  if (Node.isVariableDeclaration(parent)) {
    const declarations = parent.getVariableStatement()?.getDeclarations();

    return { types: (declarations ?? [])?.map((d) => d.getType()), nullable: false };
  }
  const typeOfVariableCall = findTypeOfVariableCall(ref);
  return { types: typeOfVariableCall ? [typeOfVariableCall] : [], nullable: false };
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

            const typesFromUsage = element.findReferencesAsNodes().flatMap((ref) => findTypeFromRefUsage(ref));

            const type = computeTypesFromRefs(filterUnusableTypes(typesFromUsage));

            const propertyName = element.getPropertyNameNode()?.getText() ?? element.getName();

            return type ? ({ propertyName, type } as const) : null;
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
function findTypeOfVariableCall(ref: Node): Type | null {
  const parent = ref.getParent();
  if (!Node.isCallExpression(parent)) {
    return null;
  }
  const idxOfCallParameter = parent.getArguments().indexOf(ref);
  const functionDeclaredParametersTypes = getParameterTypesFromCallerSignature(parent);
  return functionDeclaredParametersTypes && functionDeclaredParametersTypes[idxOfCallParameter]
    ? functionDeclaredParametersTypes[idxOfCallParameter]
    : null;
}

export function getParameterTypesFromCallerSignature(callExpression: CallExpression | NewExpression): Type[] {
  const functionItself = callExpression.getExpression();

  if (Node.isIdentifier(functionItself) || Node.isPropertyAccessExpression(functionItself)) {
    return getParametersOfCallSignature(functionItself);
  }

  return [];
}

export function getPropsTypeOfJsxElement(
  jsxTagNamedNode: JsxSelfClosingElement | JsxOpeningElement
): Record<string, Type> {
  const signatures = jsxTagNamedNode.getTagNameNode().getType().getCallSignatures();
  if (signatures.length > 0) {
    const parameters = signatures[0].getParameters(); // There should be only one parameters: the props
    if (parameters.length > 0) {
      const propsDefinition = parameters[0];
      const propertiesOfProps = propsDefinition.getTypeAtLocation(jsxTagNamedNode).getProperties();

      return Object.fromEntries(
        propertiesOfProps.map((p) => {
          return [p.getName(), p.getTypeAtLocation(jsxTagNamedNode)] as const;
        })
      );
    }
  }
  return {};
}

// if node has a type of something callable, get the parameters of the type associated
// could be a function, an arrow function, a method
// eg. `n: (a: string, b:number) => void`  => [string, number]
function getParametersOfCallSignature(node: Node): Type[] {
  const signatures = node?.getType().getCallSignatures();
  if (signatures?.length > 0) {
    return signatures[0].getParameters().map((p) => p.getTypeAtLocation(node));
  }
  return [];
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
