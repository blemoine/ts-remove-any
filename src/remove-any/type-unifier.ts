import { BinaryExpression, Node, ParameterDeclaration, ReferenceFindableNode, Type } from "ts-morph";
import { isNotNil } from "../utils/is-not-nil";
import { getParameterTypesFromCallerSignature } from "./type.utils";
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

function isAssignation(parent: Node): parent is BinaryExpression {
  return Node.isBinaryExpression(parent) && parent.getOperatorToken().getText() === "=";
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

        return [
          callablesTypes.parameterTypes[parameterIdx],
          ...callablesTypes.argumentsTypes.map((p) => p[parameterIdx]),
          ...(callablesTypes.usageInFunction[parameterIdx] ?? []),
        ].filter(isNotNil);
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

          return [
            callablesTypes.parameterTypes[parameterIdx],
            ...callablesTypes.argumentsTypes.map((p) => p[parameterIdx]),
            ...(callablesTypes.usageInFunction[parameterIdx] ?? []),
          ].filter(isNotNil);
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
          if (Node.isParameterDeclaration(parameterDeclaration) || Node.isVariableDeclaration(parameterDeclaration)) {
            return parameterDeclaration.findReferencesAsNodes().flatMap((p): Type[] => {
              const callExpression = p.getParent();
              if (Node.isCallExpression(callExpression)) {
                return [
                  getParameterTypesFromCallerSignature(callExpression)[parameterIdx],
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
      if (Node.isTypeLiteral(interfaceDeclaration)) {
        const typeAliasDeclaration = interfaceDeclaration.getParent();
        if (Node.isTypeAliasDeclaration(typeAliasDeclaration)) {
          return typeAliasDeclaration.findReferencesAsNodes().flatMap((t): Type[] => {
            const typeReference = t.getParent();
            if (Node.isTypeReference(typeReference)) {
              const parameterDeclaration = typeReference.getParent();
              if (
                Node.isParameterDeclaration(parameterDeclaration) ||
                Node.isVariableDeclaration(parameterDeclaration)
              ) {
                return parameterDeclaration.findReferencesAsNodes().flatMap((p): Type[] => {
                  const propertyName = propertySignature.getName();
                  const parameterRef = p.getParent();
                  if (Node.isPropertyAccessExpression(parameterRef) && parameterRef.getName() === propertyName) {
                    const callExpression = parameterRef.getParent();
                    if (Node.isCallExpression(callExpression)) {
                      return [
                        getParameterTypesFromCallerSignature(callExpression)[parameterIdx],
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
      if (Node.isInterfaceDeclaration(interfaceDeclaration)) {
        return interfaceDeclaration.findReferencesAsNodes().flatMap((t): Type[] => {
          const typeReference = t.getParent();
          if (Node.isTypeReference(typeReference)) {
            const parameterDeclaration = typeReference.getParent();

            if (Node.isParameterDeclaration(parameterDeclaration) || Node.isVariableDeclaration(parameterDeclaration)) {
              return parameterDeclaration.findReferencesAsNodes().flatMap((p): Type[] => {
                const propertyName = propertySignature.getName();
                const parameterRef = p.getParent();
                if (Node.isPropertyAccessExpression(parameterRef) && parameterRef.getName() === propertyName) {
                  const callExpression = parameterRef.getParent();
                  if (Node.isCallExpression(callExpression)) {
                    return [
                      getParameterTypesFromCallerSignature(callExpression)[parameterIdx],
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
  } else if (isFunctionLike(parent) || Node.isConstructorDeclaration(parent)) {
    const parameterIdx = ref.getChildIndex();

    const callablesTypes = getCallablesTypes(parent);

    return [
      callablesTypes.parameterTypes[parameterIdx],
      ...callablesTypes.argumentsTypes.map((p) => p[parameterIdx]),
      ...(callablesTypes.usageInFunction[parameterIdx] ?? []),
    ].filter(isNotNil);
  }

  return [];
}

const isFunctionLike = combineGuards(
  combineGuards(Node.isFunctionDeclaration, Node.isMethodDeclaration),
  Node.isArrowFunction
);
