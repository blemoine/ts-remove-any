import { ArrowFunction, FunctionDeclaration, Node, Type, VariableDeclaration } from "ts-morph";
import { isNotNil } from "../../utils/is-not-nil";
import { cannotHappen } from "../../utils/cannot-happen";

interface CallableType {
  parameterTypes: Type[];
  argumentsTypes: Type[][];
}

export function getCallablesTypes(functionDeclaration: FunctionDeclaration | ArrowFunction): CallableType {
  let referencableNode: FunctionDeclaration | VariableDeclaration | null;
  if (Node.isFunctionDeclaration(functionDeclaration)) {
    referencableNode = functionDeclaration;
  } else if (Node.isArrowFunction(functionDeclaration)) {
    const variableDeclaration = functionDeclaration.getParent();
    if (Node.isVariableDeclaration(variableDeclaration)) {
      referencableNode = variableDeclaration;
    } else {
      referencableNode = null;
    }
  } else {
    cannotHappen(functionDeclaration);
  }

  const argumentsTypes = (referencableNode?.findReferencesAsNodes() ?? [])
    .map((ref) => {
      const parent = ref.getParent();

      if (Node.isCallExpression(parent)) {
        // the function is called
        const functionCalled = parent.getExpression();
        if (functionCalled === ref) {
          return parent.getArguments().map((argument) => argument.getType());
        } else {
          // the function is passed as an argument to another function

          if (Node.isIdentifier(functionCalled) || Node.isPropertyAccessExpression(functionCalled)) {
            const idxOfDeclaration = parent.getArguments().findIndex((s) => s === ref);

            const callerCallSignatures = functionCalled.getType().getCallSignatures();
            if (callerCallSignatures.length > 0) {
              const callerFirstCallSignature = callerCallSignatures[0];
              const parameterPosition = callerFirstCallSignature.getParameters()[idxOfDeclaration];
              if (parameterPosition) {
                const higherLevelFnTypeOfCaller = parameterPosition.getTypeAtLocation(functionCalled);

                const callSignatures = higherLevelFnTypeOfCaller.getCallSignatures();
                if (callSignatures.length > 0) {
                  return callSignatures[0].getParameters().map((p) => p.getTypeAtLocation(functionCalled));
                }
              }
            }
          }
        }
      }
      return null;
    })
    .filter(isNotNil);

  const parameterTypes = functionDeclaration.getParameters().map((p) => p.getType());

  return { parameterTypes, argumentsTypes: argumentsTypes.map((a) => a.slice(0, parameterTypes.length)) };
}
