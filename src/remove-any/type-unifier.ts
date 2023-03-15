import { BinaryExpression, Node, ParameterDeclaration, ReferenceFindableNode } from "ts-morph";
import { isNotNil } from "../utils/is-not-nil";
import { getPropsTypeOfJsx, TypesFromRefs } from "./type.utils";
import { combineGuards } from "../utils/type-guard.utils";
import { CallableType, getCallablesTypes } from "./type-unifier/callables.unifier";
import { FakeType } from "./fake-type.utils";

export function allTypesOfRefs(node: ReferenceFindableNode): TypesFromRefs {
  const referencesAsNodes = node.findReferencesAsNodes();
  const typesFromReference = referencesAsNodes.flatMap((ref) => allTypesOfRef(ref));

  const typesFromLambda = node instanceof ParameterDeclaration ? allTypesOfRef(node) : [];

  if (referencesAsNodes.length === 0 && typesFromLambda.length === 1 && typesFromLambda[0].isAny()) {
    return { types: [], unknown: true, nullable: false };
  }

  return { types: deduplicateTypes([...typesFromReference, ...typesFromLambda]), unknown: false, nullable: false };
}

function deduplicateTypes(types: (FakeType | null | undefined)[]): FakeType[] {
  return [
    ...types
      .filter(isNotNil)
      .reduce((map, type) => {
        const typeText = type.getText();
        if (!map.has(typeText)) {
          map.set(typeText, type);
        }
        return map;
      }, new Map<string, FakeType>())
      .values(),
  ];
}

function isAssignation(parent: Node): parent is BinaryExpression {
  return Node.isBinaryExpression(parent) && parent.getOperatorToken().getText() === "=";
}

function allTypesOfRef(ref: Node): FakeType[] {
  const parent = ref.getParent();
  if (!parent) {
    return [];
  }

  // x = y
  if (isAssignation(parent)) {
    return [parent.getLeft().getType(), parent.getRight().getType()];
  }

  if (Node.isJsxSpreadAttribute(parent)) {
    const jsxElement = parent.getParent().getParent();
    if (Node.isJsxOpeningElement(jsxElement) || Node.isJsxSelfClosingElement(jsxElement)) {
      const propertiesOfProps = getPropsTypeOfJsx(jsxElement);
      if (propertiesOfProps) {
        return [ref.getType(), propertiesOfProps];
      }
    }
  }
  if (Node.isJsxExpression(parent)) {
    const contextualType = parent.getContextualType();
    if (contextualType) {
      return [ref.getType(), contextualType];
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
      return [ref.getType(), closestFunctionDeclaration.getReturnType()];
    }
  }

  if (Node.isVariableDeclaration(parent)) {
    return [ref.getType(), parent.getType()];
  }
  if (Node.isArrayLiteralExpression(parent)) {
    const typesOfRefInArray = allTypesOfRef(parent);
    if (typesOfRefInArray.every((t) => t.isArray())) {
      return typesOfRefInArray.map((t) => t.getTypeArguments()[0]);
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
            return t.getProperty(propertyName)?.getTypeAtLocation(greatParent);
          })
          .filter(isNotNil);
      }
    }
  }

  if (Node.isFunctionTypeNode(parent)) {
    const parameterIdx = ref.getChildIndex();
    const propertySignature = parent.getParent();

    if (Node.isTypeAliasDeclaration(propertySignature) || Node.isPropertySignature(propertySignature)) {
      const callablesTypes = getCallablesTypes(parent);
      return getCallableTypesOfParameter(callablesTypes, parameterIdx);
    }
  } else if (isFunctionLike(parent) || Node.isConstructorDeclaration(parent)) {
    const parameterIdx = ref.getChildIndex();

    const callablesTypes = getCallablesTypes(parent);

    return getCallableTypesOfParameter(callablesTypes, parameterIdx);
  }

  return [];
}

const isFunctionLike = combineGuards(
  combineGuards(Node.isFunctionDeclaration, Node.isMethodDeclaration),
  Node.isArrowFunction
);

function getCallableTypesOfParameter(callablesType: CallableType, parameterIdx: number): FakeType[] {
  return [
    callablesType.parameterTypes[parameterIdx],
    ...callablesType.argumentsTypes.map((p) => p[parameterIdx]),
    ...[callablesType.usageInFunction[parameterIdx]],
  ].filter(isNotNil);
}
