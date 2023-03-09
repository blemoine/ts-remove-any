import {
  ArrowFunction,
  BinaryExpression,
  CallExpression,
  FunctionDeclaration,
  MethodDeclaration,
  NewExpression,
  Node,
  ParameterDeclaration,
  ReferenceFindableNode,
  Type,
} from "ts-morph";
import { isNotNil } from "../utils/is-not-nil";

export function allTypesOfRefs(node: ReferenceFindableNode): Type[] {
  const referencesAsNodes = node.findReferencesAsNodes();
  const typesFromReference = referencesAsNodes.flatMap((ref) => allTypesOfRef(ref));

  const typesFromLambda = node instanceof ParameterDeclaration ? allTypesOfLambda(node) : [];

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

          const typeOfFunctionParameters = getFunctionDeclaredParametersType(refParent)[functionParameterIdx];

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

function allTypesOfLambda(node: ParameterDeclaration): Type[] {
  const parent = node.getParent();

  const parameterIdx = node.getChildIndex();
  const nodeType = node.getType();

  // TODO most probably this horrible pyramid can be flattened

  if (Node.isFunctionTypeNode(parent)) {
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
                  getFunctionDeclaredParametersType(callExpression)[parameterIdx],
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
                      getFunctionDeclaredParametersType(callExpression)[parameterIdx],
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
  }
  if (Node.isArrowFunction(parent)) {
    const variableDeclaration = parent.getParent();
    if (Node.isVariableDeclaration(variableDeclaration)) {
      const typesOfReferencableDeclaration = getTypesOfReferencableAndCallableNode(variableDeclaration);

      return typesOfReferencableDeclaration.length > 0
        ? [nodeType, ...typesOfReferencableDeclaration.map((p) => p[parameterIdx])]
        : [nodeType];
    }
  } else if (
    Node.isFunctionDeclaration(parent) ||
    Node.isConstructorDeclaration(parent) ||
    Node.isMethodDeclaration(parent)
  ) {
    const typesOfReferencableDeclaration = getTypesOfReferencableAndCallableNode(parent);

    return typesOfReferencableDeclaration.length > 0
      ? [nodeType, ...typesOfReferencableDeclaration.map((p) => p[parameterIdx])]
      : [nodeType];
  }
  return [];
}

function isAssignation(parent: Node): parent is BinaryExpression {
  return Node.isBinaryExpression(parent) && parent.getOperatorToken().getText() === "=";
}

function getFunctionDeclaredParametersType(callExpression: CallExpression | NewExpression): Type[] {
  const functionItself = callExpression.getExpression();

  if (Node.isIdentifier(functionItself) || Node.isPropertyAccessExpression(functionItself)) {
    return getParametersOfCallSignature(functionItself);
  }

  return [];
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

function getConstructorDeclaredParametersType(newExpression: NewExpression): Type[] {
  const constructorItself = newExpression.getExpression();
  if (Node.isIdentifier(constructorItself)) {
    const classDeclaration = constructorItself
      .findReferencesAsNodes()
      .map((r) => r.getParent())
      .find(Node.isClassDeclaration);

    const constructorDeclaration = (classDeclaration?.getChildren() ?? [])
      .flatMap((c) => [c, ...c.getChildren()])
      .find(Node.isConstructorDeclaration);

    const parameters = constructorDeclaration?.getParameters() ?? [];

    return parameters.map((p) => p.getType());
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

  // fn(x)  where fn is either a function, an arrow function or a method (obj.fn(x))
  if (Node.isCallExpression(parent)) {
    const functionArguments = parent.getArguments();
    const parameterIdx = functionArguments.indexOf(ref);
    const argument = functionArguments[parameterIdx];
    if (argument) {
      const declaredParametersType = getFunctionDeclaredParametersType(parent);
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
    const closestFunctionDeclaration = parent
      .getAncestors()
      .find(
        (a): a is ArrowFunction | FunctionDeclaration | MethodDeclaration =>
          Node.isArrowFunction(a) || Node.isFunctionDeclaration(a) || Node.isMethodDeclaration(a)
      );
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

  return [];
}
