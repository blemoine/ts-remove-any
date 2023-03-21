import { Node, ParameterDeclaration, VariableDeclaration } from "ts-morph";
import { isNotNil } from "../utils/is-not-nil";
import { getPropsTypeOfJsx, TypesFromRefs } from "./type.utils";
import { combineGuards } from "../utils/type-guard.utils";
import { CallableType, getCallablesTypes } from "./type-unifier/callables.unifier";
import { SyntaxKind } from "typescript";
import { createTypeModelFromNode, createTypeModelFromType, getText, TypeModel } from "./type-model/type-model";

export function allTypesOfRefs(node: VariableDeclaration | ParameterDeclaration): TypesFromRefs {
  const referencesAsNodes = node.findReferencesAsNodes();
  const typesFromReference = referencesAsNodes.flatMap((ref) => allTypesOfRef(ref));

  const typesFromLambda = node instanceof ParameterDeclaration ? allTypesOfRef(node) : [];

  if (referencesAsNodes.length === 0 && typesFromLambda.length === 1 && typesFromLambda[0].kind === "any") {
    return { types: [], unknown: true, nullable: false };
  }

  return { types: deduplicateTypes([...typesFromReference, ...typesFromLambda]), unknown: false, nullable: false };
}

function deduplicateTypes(types: (TypeModel | null | undefined)[]): TypeModel[] {
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

function allTypesOfRef(ref: Node): TypeModel[] {
  const parent = ref.getParent();
  if (!parent) {
    return [];
  }

  if (Node.isPrefixUnaryExpression(parent)) {
    const operator = parent.getOperatorToken();
    if (operator === SyntaxKind.PlusToken || operator === SyntaxKind.MinusToken) {
      const operand = parent.getOperand();
      if (operand.getType().isNumberLiteral()) {
        return [createTypeModelFromType(operand.getType(), ref)];
      } else {
        return [{ kind: "number" }];
      }
    }
  }
  if (Node.isBinaryExpression(parent)) {
    const operator = parent.getOperatorToken().getText();
    const left = parent.getLeft();
    const right = parent.getRight();

    if (operator === "=") {
      return [createTypeModelFromType(left.getType(), ref), createTypeModelFromType(right.getType(), ref)];
    } else if (operator === "-" || operator === "**" || operator === "*" || operator === "/") {
      if (left === ref && left.getType().isNumberLiteral()) {
        return [createTypeModelFromType(left.getType(), ref)];
      } else if (right === ref && right.getType().isNumberLiteral()) {
        return [createTypeModelFromType(right.getType(), ref)];
      } else {
        return [{ kind: "number" }];
      }
    }
  }

  if (Node.isJsxSpreadAttribute(parent)) {
    const jsxElement = parent.getParent().getParent();
    if (Node.isJsxOpeningElement(jsxElement) || Node.isJsxSelfClosingElement(jsxElement)) {
      const propertiesOfProps = getPropsTypeOfJsx(jsxElement);
      if (propertiesOfProps) {
        return [createTypeModelFromNode(ref), createTypeModelFromType(propertiesOfProps, ref)];
      }
    }
  }
  if (Node.isJsxExpression(parent)) {
    const contextualType = parent.getContextualType();
    if (contextualType) {
      return [createTypeModelFromNode(ref), createTypeModelFromType(contextualType, ref)];
    }
  }

  if (Node.isCallExpression(parent)) {
    const functionArguments = parent.getArguments();
    const parameterIdx = functionArguments.indexOf(ref);
    const callable = parent.getExpression();

    if (Node.isIdentifier(callable) || Node.isPropertyAccessExpression(callable)) {
      const functionDeclaration = callable
        .findReferencesAsNodes()
        .map((r) => {
          const parent = r.getParent();

          if (Node.isVariableDeclaration(parent)) {
            return parent.getInitializer();
          } else {
            return parent;
          }
        })
        .find(isFunctionLike);

      if (functionDeclaration) {
        const callablesTypes = getCallablesTypes(functionDeclaration);

        return getCallableTypesOfParameter(callablesTypes, parameterIdx);
      }
    }
  }
  // new T(x)
  if (Node.isNewExpression(parent)) {
    const constructorArguments = parent.getArguments();
    const parameterIdx = constructorArguments.indexOf(ref);
    const expression = parent.getExpression();
    if (Node.isIdentifier(expression)) {
      const classDeclaration = expression
        .findReferencesAsNodes()
        .map((ref) => ref.getParent())
        .find(Node.isClassDeclaration);
      if (classDeclaration) {
        const constructors = classDeclaration.getConstructors();
        if (constructors.length > 0) {
          const callablesTypes = getCallablesTypes(constructors[0]);

          return getCallableTypesOfParameter(callablesTypes, parameterIdx);
        }
      }
    }
  }
  if (Node.isReturnStatement(parent)) {
    const closestFunctionDeclaration = parent.getAncestors().find(isFunctionLike);

    if (closestFunctionDeclaration) {
      return [createTypeModelFromNode(ref), createTypeModelFromType(closestFunctionDeclaration.getReturnType(), ref)];
    }
  }

  if (Node.isVariableDeclaration(parent)) {
    return [createTypeModelFromNode(ref), createTypeModelFromType(parent.getType(), ref)];
  }
  if (Node.isArrayLiteralExpression(parent)) {
    const typesOfRefInArray = allTypesOfRef(parent);
    if (typesOfRefInArray.every((t) => t.kind === "array")) {
      return typesOfRefInArray.map((t) => (t.kind === "array" ? t.value() : null)).filter(isNotNil);
    }
  }
  if (Node.isPropertyAssignment(parent)) {
    const propertyNameNode = parent.getNameNode();
    if (Node.isIdentifier(propertyNameNode)) {
      const greatParent = parent.getParent();
      if (Node.isObjectLiteralExpression(greatParent)) {
        const wrapperTypes = allTypesOfRef(greatParent);
        const propertyName = propertyNameNode.getText();

        return wrapperTypes
          .map((t) => {
            if (t.kind !== "object") {
              return null;
            }

            return t.value()[propertyName];
          })
          .filter(isNotNil);
      }
    }
  }

  if (Node.isFunctionTypeNode(parent)) {
    const parameterIdx = parent.getParameters().findIndex((p) => p === ref);
    const propertySignature = parent.getParent();

    if (Node.isTypeAliasDeclaration(propertySignature) || Node.isPropertySignature(propertySignature)) {
      const callablesTypes = getCallablesTypes(parent);
      return getCallableTypesOfParameter(callablesTypes, parameterIdx);
    }
  } else if (isFunctionLike(parent) || Node.isConstructorDeclaration(parent)) {
    const parameterIdx = parent.getParameters().findIndex((p) => p === ref);

    const callablesTypes = getCallablesTypes(parent);
    return getCallableTypesOfParameter(callablesTypes, parameterIdx);
  }

  return [];
}

const isFunctionLike = combineGuards(
  combineGuards(Node.isFunctionDeclaration, Node.isMethodDeclaration),
  Node.isArrowFunction
);

function getCallableTypesOfParameter(callablesType: CallableType, parameterIdx: number): TypeModel[] {
  return [
    callablesType.parameterTypes[parameterIdx],
    ...callablesType.argumentsTypes.map((p) => p[parameterIdx]),
    ...[callablesType.usageInFunction[parameterIdx]],
  ].filter(isNotNil);
}
