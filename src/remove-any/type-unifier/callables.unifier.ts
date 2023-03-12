import {
  ArrowFunction,
  ConstructorDeclaration,
  FunctionDeclaration,
  FunctionTypeNode,
  MethodDeclaration,
  Node,
  ReferenceFindableNode,
  Type,
} from "ts-morph";
import { cannotHappen } from "../../utils/cannot-happen";
import { getParameterTypesFromCallerSignature, getPropsTypeOfJsxElement } from "../type.utils";
import { isNotNil } from "../../utils/is-not-nil";

export interface CallableType {
  parameterTypes: Type[];
  argumentsTypes: Type[][];
  usageInFunction: Record<number, Type[]>; // this one exist because the parameterTypes may be `any`...
}

type RuntimeCallable = FunctionDeclaration | ArrowFunction | MethodDeclaration | ConstructorDeclaration;

export function getCallablesTypes(functionDeclaration: RuntimeCallable | FunctionTypeNode): CallableType {
  const referencableNode = getReferencableNodeFromCallableType(functionDeclaration);

  const argumentsTypes: Type[][] = (referencableNode?.findReferencesAsNodes() ?? [])
    .map<Type[][]>((ref) => {
      const parent = ref.getParent();
      if (Node.isTypeReference(parent)) {
        const greatParent = parent.getParent();
        if (Node.isParameterDeclaration(greatParent)) {
          return greatParent
            .findReferencesAsNodes()
            .map((r) => getArgumentTypesFromRef(r))
            .filter(isNotNil);
        }
      }
      return [getArgumentTypesFromRef(ref)];
    })
    .flat(1)
    .filter((l) => l.length > 0);

  const parameterTypes = functionDeclaration.getParameters().map((p) => p.getType());
  const usageInFunction = Node.isFunctionTypeNode(functionDeclaration)
    ? {}
    : Object.fromEntries(
        functionDeclaration
          .getParameters()
          .map((p, idx) => {
            return [
              idx,
              p
                .findReferencesAsNodes()
                .filter((ref) => ref !== p)
                .flatMap((ref): Type[] => {
                  const parent = ref.getParent();
                  const refType = ref.getType();
                  if (Node.isCallExpression(parent)) {
                    const argIdx = parent.getArguments().findIndex((a) => a === ref);

                    return [refType, getParameterTypesFromCallerSignature(parent)[argIdx]];
                  }

                  return [refType];
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

// If ref is a parameter used in a call expression, get the type of the parameter
function getArgumentTypesFromRef(ref: Node): Type[] {
  // the function is called
  const parent = ref.getParent();

  if (Node.isPropertyAccessExpression(parent)) {
    return getArgumentTypesFromRef(parent);
  }
  if (Node.isJsxExpression(parent)) {
    const greatParent = parent.getParent();
    if (Node.isJsxAttribute(greatParent)) {
      const attributeName = greatParent.getName();
      const greatGreatParent = greatParent.getParent()?.getParent();

      if (Node.isJsxSelfClosingElement(greatGreatParent) || Node.isJsxOpeningElement(greatGreatParent)) {
        const higherLevelFnTypeOfCaller = getPropsTypeOfJsxElement(greatGreatParent)[attributeName];
        if (higherLevelFnTypeOfCaller) {
          const callSignatures = higherLevelFnTypeOfCaller.getCallSignatures();
          if (callSignatures.length > 0) {
            return callSignatures[0].getParameters().map((p) => p.getTypeAtLocation(greatGreatParent));
          }
        }
      }
    }
  } else if (Node.isCallExpression(parent) || Node.isNewExpression(parent)) {
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
  return [];
}

function getReferencableNodeFromCallableType(
  functionDeclaration: RuntimeCallable | FunctionTypeNode
): ReferenceFindableNode | null {
  if (
    Node.isFunctionDeclaration(functionDeclaration) ||
    Node.isMethodDeclaration(functionDeclaration) ||
    Node.isConstructorDeclaration(functionDeclaration)
  ) {
    return functionDeclaration;
  } else if (Node.isArrowFunction(functionDeclaration)) {
    const variableDeclaration = functionDeclaration.getParent();
    if (Node.isVariableDeclaration(variableDeclaration)) {
      return variableDeclaration;
    } else {
      return null;
    }
  } else if (Node.isFunctionTypeNode(functionDeclaration)) {
    const variableDeclaration = functionDeclaration.getParent();
    if (Node.isTypeAliasDeclaration(variableDeclaration)) {
      return variableDeclaration;
    } else {
      return null;
    }
  } else {
    cannotHappen(functionDeclaration);
  }
}
