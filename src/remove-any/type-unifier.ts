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
  const functionItself = callExpression.getChildren()[0];
  if (Node.isIdentifier(functionItself)) {
    const functionDeclaration = functionItself
      .findReferencesAsNodes()
      .map((r) => r.getParent())
      .find(Node.isFunctionDeclaration);
    const parameters = functionDeclaration?.getParameters() ?? [];

    return parameters.map((p) => p.getType());
  }
  if (Node.isPropertyAccessExpression(functionItself)) {
    const signatures = functionItself?.getType().getCallSignatures();
    if (signatures?.length > 0) {
      return signatures[0].getParameters().map((p) => p.getTypeAtLocation(functionItself));
    }
  }

  return [];
}

function getConstructorDeclaredParametersType(newExpression: NewExpression): Type[] {
  const constructorItself = newExpression.getChildren()[1];
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

function getArrowFunctionDeclaredParametersType(callExpression: CallExpression): Type[] {
  const functionItself = callExpression.getChildren()[0];
  if (Node.isIdentifier(functionItself)) {
    const arrowFunctionDeclaration = functionItself
      .findReferencesAsNodes()
      .map((r) => r.getParent())
      .find(Node.isVariableDeclaration);
    const children = arrowFunctionDeclaration?.getChildren();
    if (!children) {
      return [];
    }
    const arrowFn = children[2];
    if (Node.isArrowFunction(arrowFn)) {
      const parameters = arrowFn?.getParameters() ?? [];

      return parameters.map((p) => p.getType());
    }
  }
  return [];
}

function getMethodDeclaredParametersType(callExpression: CallExpression): Type[] {
  const methodItself = callExpression.getChildren()[0];
  if (Node.isPropertyAccessExpression(methodItself)) {
    const methodDeclaration = methodItself
      .findReferencesAsNodes()
      .map((r) => r.getParent())
      .find(Node.isMethodDeclaration);
    const parameters = methodDeclaration?.getParameters() ?? [];

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
      const declaredParametersTypeOfArrow = getArrowFunctionDeclaredParametersType(parent);
      if (parameterIdx >= 0 && declaredParametersTypeOfArrow[parameterIdx]) {
        return [argument.getType(), declaredParametersTypeOfArrow[parameterIdx]];
      }
      const declaredParametersTypeOfMethod = getMethodDeclaredParametersType(parent);
      if (parameterIdx >= 0 && declaredParametersTypeOfMethod[parameterIdx]) {
        return [argument.getType(), declaredParametersTypeOfMethod[parameterIdx]];
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
    const children = parent.getChildren();

    const propertyNameNode = children[0];
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
