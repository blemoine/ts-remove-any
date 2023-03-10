import { ArrowFunction, FunctionDeclaration, MethodDeclaration, Node, ReferenceFindableNode, Type } from "ts-morph";
import { isNotNil } from "../../utils/is-not-nil";
import { cannotHappen } from "../../utils/cannot-happen";
import { getParameterTypesFromCallerSignature } from "../type.utils";

interface CallableType {
  parameterTypes: Type[];
  argumentsTypes: Type[][];
  usageInFunction: Record<number, Type[]>; // this one exist because the parameterTypes may be `any`...
}

export function getCallablesTypes(
  functionDeclaration: FunctionDeclaration | ArrowFunction | MethodDeclaration
): CallableType {
  const referencableNode = getReferencableNodeFromCallableType(functionDeclaration);

  const argumentsTypes = (referencableNode?.findReferencesAsNodes() ?? [])
    .map((ref) => {
      const parent = ref.getParent();
      if (Node.isPropertyAccessExpression(parent)) {
        const greatParent = parent.getParent();
        if (Node.isCallExpression(greatParent)) {
          const functionCalled = greatParent.getExpression();
          if (functionCalled === parent) {
            return greatParent.getArguments().map((argument) => argument.getType());
          } else {
            // the function is passed as an argument to another function
            const idxOfDeclaration = greatParent.getArguments().findIndex((s) => s === parent);

            const higherLevelFnTypeOfCaller = getParameterTypesFromCallerSignature(greatParent)[idxOfDeclaration];

            if (higherLevelFnTypeOfCaller) {
              const callSignatures = higherLevelFnTypeOfCaller.getCallSignatures();
              if (callSignatures.length > 0) {
                return callSignatures[0].getParameters().map((p) => p.getTypeAtLocation(functionCalled));
              }
            }
          }
        }
      } else if (Node.isCallExpression(parent)) {
        // the function is called

        const functionCalled = parent.getExpression();
        if (functionCalled === ref) {
          return parent.getArguments().map((argument) => argument.getType());
        } else {
          // the function is passed as an argument to another function
          const idxOfDeclaration = parent.getArguments().findIndex((s) => s === ref);

          const higherLevelFnTypeOfCaller = getParameterTypesFromCallerSignature(parent)[idxOfDeclaration];
          if (higherLevelFnTypeOfCaller) {
            const callSignatures = higherLevelFnTypeOfCaller.getCallSignatures();
            if (callSignatures.length > 0) {
              return callSignatures[0].getParameters().map((p) => p.getTypeAtLocation(functionCalled));
            }
          }
        }
      }
      return null;
    })
    .filter(isNotNil);

  const parameterTypes = functionDeclaration.getParameters().map((p) => p.getType());
  const usageInFunction = Object.fromEntries(
    functionDeclaration
      .getParameters()
      .map((p, idx) => {
        return [
          idx,
          p
            .findReferencesAsNodes()
            .filter((ref) => ref !== p)
            .flatMap((ref) => {
              const parent = ref.getParent();
              if (Node.isCallExpression(parent)) {
                const argIdx = parent.getArguments().findIndex((a) => a === ref);

                return [ref.getType(), getParameterTypesFromCallerSignature(parent)[argIdx]];
              }

              return [ref.getType()];
            }),
        ] as const;
      })
      .filter(([, types]) => types.length > 0)
  );

  return {
    parameterTypes,
    argumentsTypes: argumentsTypes.map((a) => a.slice(0, parameterTypes.length)),
    usageInFunction,
  };
}

function getReferencableNodeFromCallableType(
  functionDeclaration: FunctionDeclaration | ArrowFunction | MethodDeclaration
): ReferenceFindableNode | null {
  if (Node.isFunctionDeclaration(functionDeclaration) || Node.isMethodDeclaration(functionDeclaration)) {
    return functionDeclaration;
  } else if (Node.isArrowFunction(functionDeclaration)) {
    const variableDeclaration = functionDeclaration.getParent();
    if (Node.isVariableDeclaration(variableDeclaration)) {
      return variableDeclaration;
    } else {
      return null;
    }
  } else {
    cannotHappen(functionDeclaration);
  }
}
