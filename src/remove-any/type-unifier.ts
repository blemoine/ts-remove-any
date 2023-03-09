import { BinaryExpression, NewExpression, Node, ParameterDeclaration, ReferenceFindableNode, Type } from "ts-morph";
import { isNotNil } from "../utils/is-not-nil";
import { getCallExpressionDeclaredParametersType } from "./type.utils";
import { combineGuards } from "../utils/type-guard.utils";
import { getCallablesTypes } from "./type-unifier/callables.unifier";

export function allTypesOfRefs(node: ReferenceFindableNode): Type[] {
  const referencesAsNodes = node.findReferencesAsNodes();
  const typesFromReference = referencesAsNodes.flatMap((ref) => allTypesOfRef(ref));

  const typesFromLambda = node instanceof ParameterDeclaration ? allTypesOfRef(node) : [];

  return deduplicateTypes([...typesFromReference, ...typesFromLambda]);
}

function deduplicateTypes(types: (Type | null | undefined)[]): Type[] {
  return [
    ...types
      .filter(isNotNil)
      .reduce((map, type) => {
        const typeText = type.getText();
        if (!map.has(typeText)) {
          map.set(typeText, type);
        }
        return map;
      }, new Map<string, Type>())
      .values(),
  ];
}

function getTypesOfReferencableAndCallableNode(referencableNode: ReferenceFindableNode): Type[][] {
  return referencableNode
    .findReferencesAsNodes()
    .map((r) => {
      let refParent = r.getParent();
      if (Node.isPropertyAccessExpression(refParent)) {
        refParent = refParent.getParent();
      }

      if (Node.isCallExpression(refParent) || Node.isNewExpression(refParent)) {
        const parentArguments = refParent.getArguments();
        const functionParameterIdx = parentArguments.indexOf(r);
        if (functionParameterIdx >= 0) {
          // the function is the argument of another function

          const typeOfFunctionParameters = getCallExpressionDeclaredParametersType(refParent)[functionParameterIdx];

          const callSignatures = typeOfFunctionParameters?.getCallSignatures() ?? [];
          if (callSignatures.length > 0) {
            return callSignatures[0].getParameters().map((p) => p.getTypeAtLocation(refParent as Node));
          }
        } else {
          // the function is the called.

          return parentArguments.map((p) => p.getType());
        }
      }
      return null;
    })
    .filter(isNotNil);
}

function isAssignation(parent: Node): parent is BinaryExpression {
  return Node.isBinaryExpression(parent) && parent.getOperatorToken().getText() === "=";
}

function getConstructorDeclaredParametersType(newExpression: NewExpression): Type[] {
  const constructorItself = newExpression.getExpression();
  if (Node.isIdentifier(constructorItself)) {
    const classDeclaration = constructorItself
      .findReferencesAsNodes()
      .map((r) => r.getParent())
      .find(Node.isClassDeclaration);

    const constructors = classDeclaration?.getConstructors();
    if (constructors && constructors.length > 0) {
      const parameters = constructors[0].getParameters() ?? [];

      return parameters.map((p) => p.getType());
    }
  }
  return [];
}

function allTypesOfRef(ref: Node): Type[] {
  const parent = ref.getParent();
  if (!parent) {
    return [];
  }

  // x = y
  if (isAssignation(parent)) {
    return [parent.getLeft().getType(), parent.getRight().getType()];
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
    const argument = functionArguments[parameterIdx];
    if (argument) {
      const declaredParametersType = getCallExpressionDeclaredParametersType(parent);
      if (parameterIdx >= 0 && declaredParametersType[parameterIdx]) {
        return [argument.getType(), declaredParametersType[parameterIdx]];
      }
    }
  }
  // new T(x)
  if (Node.isNewExpression(parent)) {
    const constructorArguments = parent.getArguments();
    const parameterIdx = constructorArguments.indexOf(ref);
    const argument = constructorArguments[parameterIdx];
    if (argument) {
      const declaredParametersType = getConstructorDeclaredParametersType(parent);
      if (parameterIdx >= 0 && declaredParametersType[parameterIdx]) {
        return [argument.getType(), declaredParametersType[parameterIdx]];
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
      const propertyName = propertyNameNode.getText();

      const greatParent = parent.getParent();
      if (Node.isObjectLiteralExpression(greatParent)) {
        const greatGreatParent = greatParent.getParent();
        if (Node.isVariableDeclaration(greatGreatParent)) {
          return [greatParent.getType(), greatGreatParent.getType()]
            .map((t) => t.getProperty(propertyName)?.getTypeAtLocation(greatParent))
            .filter(isNotNil);
        }
      }
    }
  }

  if (Node.isFunctionTypeNode(parent)) {
    const parameterIdx = ref.getChildIndex();

    const propertySignature = parent.getParent();
    if (Node.isTypeAliasDeclaration(propertySignature)) {
      return propertySignature.findReferencesAsNodes().flatMap((t): Type[] => {
        const typeReference = t.getParent();
        if (Node.isTypeReference(typeReference)) {
          const parameterDeclaration = typeReference.getParent();
          if (Node.isParameterDeclaration(parameterDeclaration)) {
            return parameterDeclaration.findReferencesAsNodes().flatMap((p): Type[] => {
              const callExpression = p.getParent();
              if (Node.isCallExpression(callExpression)) {
                return [
                  getCallExpressionDeclaredParametersType(callExpression)[parameterIdx],
                  callExpression.getArguments()[parameterIdx].getType(),
                ];
              }
              return [];
            });
          }
        }
        return [];
      });
    }
    if (Node.isPropertySignature(propertySignature)) {
      const interfaceDeclaration = propertySignature.getParent();
      if (Node.isInterfaceDeclaration(interfaceDeclaration)) {
        return interfaceDeclaration.findReferencesAsNodes().flatMap((t): Type[] => {
          const typeReference = t.getParent();
          if (Node.isTypeReference(typeReference)) {
            const parameterDeclaration = typeReference.getParent();
            if (Node.isParameterDeclaration(parameterDeclaration)) {
              return parameterDeclaration.findReferencesAsNodes().flatMap((p): Type[] => {
                const propertyName = propertySignature.getName();
                const parameterRef = p.getParent();
                if (Node.isPropertyAccessExpression(parameterRef) && parameterRef.getName() === propertyName) {
                  const callExpression = parameterRef.getParent();
                  if (Node.isCallExpression(callExpression)) {
                    return [
                      getCallExpressionDeclaredParametersType(callExpression)[parameterIdx],
                      callExpression.getArguments()[parameterIdx].getType(),
                    ];
                  }
                }
                return [];
              });
            }
          }
          return [];
        });
      }
    }
  } else if (Node.isFunctionDeclaration(parent)) {
    const callablesTypes = getCallablesTypes(parent);
    return [...callablesTypes.parameterTypes, ...callablesTypes.argumentsTypes.flat()];
  } else if (isFunctionLike(parent) || Node.isConstructorDeclaration(parent)) {
    const parameterIdx = ref.getChildIndex();
    const nodeType = ref.getType();
    const greatParent = parent.getParent();
    const referencableNode = Node.isArrowFunction(parent)
      ? Node.isVariableDeclaration(greatParent)
        ? greatParent
        : undefined
      : parent;
    const typesOfReferencableDeclaration = referencableNode
      ? getTypesOfReferencableAndCallableNode(referencableNode)
      : [];

    return typesOfReferencableDeclaration.length > 0
      ? [nodeType, ...typesOfReferencableDeclaration.map((p) => p[parameterIdx])]
      : [nodeType];
  }

  return [];
}

const isFunctionLike = combineGuards(
  combineGuards(Node.isFunctionDeclaration, Node.isMethodDeclaration),
  Node.isArrowFunction
);
