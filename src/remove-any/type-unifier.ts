import { Type, Node, ReferenceFindableNode, BinaryExpression, CallExpression, NewExpression } from "ts-morph";

export function allTypesOfRefs(node: ReferenceFindableNode): Type[] {
  return node.findReferencesAsNodes().flatMap((ref) => allTypesOfRef(ref));
}

function isAssignation(parent: Node): parent is BinaryExpression {
  return Node.isBinaryExpression(parent) && parent.getOperatorToken().getText() === "=";
}

function getFunctionDeclaredParametersType(callExpression: CallExpression): Type[] {
  const functionItself = callExpression.getChildren()[0];
  if (Node.isIdentifier(functionItself)) {
    const functionDeclaration = functionItself
      .findReferencesAsNodes()
      .map((r) => r.getParent())
      .find(Node.isFunctionDeclaration);
    const parameters = functionDeclaration?.getParameters() ?? [];

    return parameters.map((p) => p.getType());
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

function allTypesOfRef(ref: Node): Type[] {
  const parent = ref.getParent();
  if (!parent) {
    return [];
  }

  // x = y
  if (isAssignation(parent)) {
    return [parent.getLeft().getType(), parent.getRight().getType()];
  }

  // fn(x) {} or (x) => {}
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

  return [];
}