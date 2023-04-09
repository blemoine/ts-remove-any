import { Node, ParameterDeclaration, ReferenceFindableNode, Type } from "ts-morph";
import { isNotNil } from "../utils/is-not-nil";
import { getParametersOfCallSignature, getPropsTypeOfJsx, TypesFromRefs } from "./type.utils";
import { combineGuards } from "../utils/type-guard.utils";
import { CallableType, getCallablesTypes } from "./type-unifier/callables.unifier";
import { SyntaxKind } from "typescript";
import { createTypeModelFromNode, createTypeModelFromType, deduplicateTypes, TypeModel } from "./type-model/type-model";
import { cannotHappen } from "../utils/cannot-happen";
import { TypeEquation } from "./equation.model";

export function allTypesOfRefs(node: Node & ReferenceFindableNode): TypesFromRefs {
  const referencesAsNodes = node.findReferencesAsNodes();
  const typesFromReference = referencesAsNodes.flatMap((ref) => allTypesOfRef(ref)).map((equation) => equation.type);
  const typesFromLambda = (node instanceof ParameterDeclaration ? allTypesOfRef(node) : []).map(
    (equation) => equation.type
  );

  if (referencesAsNodes.length === 0 && typesFromLambda.length === 1 && typesFromLambda[0].kind === "any") {
    return { types: [{ kind: "unknown" }] };
  }

  return { types: deduplicateTypes([...typesFromReference, ...typesFromLambda]) };
}

function allTypesOfRef(ref: Node): TypeEquation[] {
  const createTypeEquation = (type: TypeModel) => new TypeEquation(ref.getText(), "equal", type);
  const createTypeEquationFromType = (type: Type) => createTypeEquation(createTypeModelFromType(type, ref));
  const createTypeEquationFromNode = (node: Node) => createTypeEquation(createTypeModelFromNode(node));
  const parent = ref.getParent();
  if (!parent) {
    return [];
  }

  if (Node.isTemplateSpan(parent)) {
    return [createTypeEquation({ kind: "string" })];
  }
  if (Node.isPrefixUnaryExpression(parent)) {
    const operator = parent.getOperatorToken();
    if (operator === SyntaxKind.PlusToken || operator === SyntaxKind.MinusToken) {
      const operand = parent.getOperand();
      if (operand.getType().isNumberLiteral()) {
        return [createTypeEquationFromType(operand.getType())];
      } else {
        return [createTypeEquation({ kind: "number" })];
      }
    }
  }
  if (Node.isBinaryExpression(parent)) {
    const operator = parent.getOperatorToken().getText();
    const left = parent.getLeft();
    const right = parent.getRight();

    if (operator === "=") {
      return [createTypeEquationFromType(left.getType()), createTypeEquationFromType(right.getType())];
    } else if (operator === "-" || operator === "**" || operator === "*" || operator === "/") {
      if (left === ref && left.getType().isNumberLiteral()) {
        return [createTypeEquationFromType(left.getType())];
      } else if (right === ref && right.getType().isNumberLiteral()) {
        return [createTypeEquationFromType(right.getType())];
      } else {
        return [createTypeEquation({ kind: "number" })];
      }
    }
  }

  if (Node.isJsxSpreadAttribute(parent)) {
    const jsxElement = parent.getParent().getParent();
    if (Node.isJsxOpeningElement(jsxElement) || Node.isJsxSelfClosingElement(jsxElement)) {
      const propertiesOfProps = getPropsTypeOfJsx(jsxElement);
      if (propertiesOfProps) {
        return [createTypeEquationFromNode(ref), createTypeEquationFromType(propertiesOfProps)];
      }
    }
  }
  if (Node.isJsxExpression(parent)) {
    const contextualType = parent.getContextualType();
    if (contextualType) {
      return [createTypeEquationFromNode(ref), createTypeEquationFromType(contextualType)];
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
          const parent2 = r.getParent();

          if (Node.isVariableDeclaration(parent2)) {
            return parent2.getInitializer();
          } else {
            return parent2;
          }
        })
        .find(isFunctionLike);

      if (functionDeclaration) {
        const callablesTypes = getCallablesTypes(functionDeclaration);
        return getCallableTypesOfParameter(callablesTypes, parameterIdx);
      } else {
        const callSignatures = callable.getType().getCallSignatures();
        if (callSignatures.length > 0) {
          const parameter = getParametersOfCallSignature(callable)[parameterIdx];
          if (parameter) {
            return [createTypeEquation(createTypeModelFromType(parameter.type, parent))];
          }
        }
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
      return [createTypeEquationFromNode(ref), createTypeEquationFromType(closestFunctionDeclaration.getReturnType())];
    }
  }

  if (Node.isVariableDeclaration(parent)) {
    return [createTypeEquationFromNode(ref), createTypeEquationFromType(parent.getType())];
  }
  if (Node.isArrayLiteralExpression(parent)) {
    const typesOfRefInArray = allTypesOfRef(parent);
    if (typesOfRefInArray.every((equation) => equation.type.kind === "array")) {
      return typesOfRefInArray
        .map((equation) => (equation.type.kind === "array" ? createTypeEquation(equation.type.value()) : null))
        .filter(isNotNil);
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
          .map((equation) => {
            if (equation.type.kind !== "object") {
              return null;
            }

            return createTypeEquation(equation.type.value()[propertyName]);
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

  if (Node.isPropertyAccessExpression(parent) && parent.getExpression() !== ref) {
    return allTypesOfRef(parent);
  }

  return [];

  function getCallableTypesOfParameter(callablesType: CallableType, parameterIdx: number): TypeEquation[] {
    const parameterDeclaredType = callablesType.parameterTypes[parameterIdx];
    if (parameterDeclaredType && parameterDeclaredType.kind !== "any" && parameterDeclaredType.kind !== "never") {
      return [createTypeEquation(parameterDeclaredType)];
    }

    return [
      parameterDeclaredType,
      ...callablesType.argumentsTypes.map((p) => p[parameterIdx]),
      ...[callablesType.usageInFunction[parameterIdx]],
    ]
      .map((t) => createTypeEquation(t))
      .filter(isNotNil);
  }
}

const isFunctionLike = combineGuards(
  combineGuards(Node.isFunctionDeclaration, Node.isMethodDeclaration),
  Node.isArrowFunction
);
