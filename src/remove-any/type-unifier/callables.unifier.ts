import {
  ArrowFunction,
  ConstructorDeclaration,
  FunctionDeclaration,
  FunctionTypeNode,
  MethodDeclaration,
  Node,
  ReferenceFindableNode,
} from "ts-morph";
import { cannotHappen } from "../../utils/cannot-happen";
import { getParameterTypesFromCallerSignature, getPropsTypeOfJsxElement } from "../type.utils";
import { isNotNil } from "../../utils/is-not-nil";
import { isNonEmptyList } from "../../utils/non-empty-list";
import {
  createTypeModelFromNode,
  createTypeModelFromType,
  getSupertype,
  getText,
  TypeModel,
} from "../type-model/type-model";

export interface CallableType {
  parameterTypes: TypeModel[];
  argumentsTypes: TypeModel[][];
  usageInFunction: Record<number, TypeModel>; // this one exist because the parameterTypes may be `any`...
}

type RuntimeCallable = FunctionDeclaration | ArrowFunction | MethodDeclaration | ConstructorDeclaration;

export function getCallablesTypes(functionDeclaration: RuntimeCallable | FunctionTypeNode): CallableType {
  const referencableNode = getReferencableNodeFromCallableType(functionDeclaration);

  const argumentsTypes: TypeModel[][] = (referencableNode?.findReferencesAsNodes() ?? [])
    .map<TypeModel[][]>((ref) => {
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

  const parameterTypes = functionDeclaration.getParameters().map((p) => {
    return createTypeModelFromNode(p);
  });
  const usageInFunction = Node.isFunctionTypeNode(functionDeclaration)
    ? {}
    : Object.fromEntries(
        functionDeclaration
          .getParameters()
          .map<readonly [number, TypeModel]>((p, idx) => {
            const usagesOfParameter = p
              .findReferencesAsNodes()
              .filter((ref) => ref !== p)
              .map((ref) => getUsageTypeFromRef(ref))
              .filter(isNotNil);

            // The final usage is a super type of usagesOfParameter
            if (isNonEmptyList(usagesOfParameter)) {
              const supertype = getSupertype(usagesOfParameter);

              return [idx, supertype] as const;
            }
            return [idx, { kind: "" }] as const;
          })
          .filter(([, types]) => getText(types).length > 0)
      );

  return {
    parameterTypes,
    argumentsTypes: argumentsTypes.map((a) => a.slice(0, parameterTypes.length)),
    usageInFunction,
  };
}

function getUsageTypeFromRef(ref: Node): TypeModel | null {
  const parent = ref.getParent();

  if (Node.isCallExpression(parent)) {
    const argIdx = parent.getArguments().findIndex((a) => a === ref);

    const parameterTypesFromCallerSignature = getParameterTypesFromCallerSignature(parent);
    const result = parameterTypesFromCallerSignature[argIdx]?.type;
    if (!result) {
      return null;
    }

    return createTypeModelFromType(result, ref);
  }
  if (Node.isJsxExpression(parent)) {
    const greatParent = parent.getParent();
    if (Node.isJsxAttribute(greatParent)) {
      const attributeName = greatParent.getName();
      const greatGreatParent = greatParent.getParent()?.getParent();

      if (Node.isJsxSelfClosingElement(greatGreatParent) || Node.isJsxOpeningElement(greatGreatParent)) {
        const selectedType = getPropsTypeOfJsxElement(greatGreatParent)[attributeName];
        if (selectedType) {
          return createTypeModelFromType(selectedType, ref);
        }
      }
    }
  }

  if (Node.isPropertyAccessExpression(parent)) {
    const attributeName = parent.getNameNode().getText();
    const usageFromRef = parent ? getUsageTypeFromRef(parent) : null;

    if (usageFromRef) {
      return { kind: "object", value: () => ({ [attributeName]: usageFromRef }) };
    }
  }

  return null;
}

// If ref is a parameter used in a call expression, get the type of the parameter
function getArgumentTypesFromRef(ref: Node): TypeModel[] {
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
            return callSignatures[0]
              .getParameters()
              .map((p) => createTypeModelFromType(p.getTypeAtLocation(greatGreatParent), ref));
          }
        }
      }
    }
  } else if (Node.isCallExpression(parent) || Node.isNewExpression(parent)) {
    const functionCalled = parent.getExpression();
    if (functionCalled === ref) {
      return parent.getArguments().map((argument) => createTypeModelFromType(argument.getType(), ref));
    } else {
      // the function is passed as an argument to another function
      const idxOfDeclaration = parent.getArguments().findIndex((s) => s === ref);
      const higherLevelFnTypeOfCaller = getParameterTypesFromCallerSignature(parent)[idxOfDeclaration]?.type;
      if (higherLevelFnTypeOfCaller) {
        const callSignatures = higherLevelFnTypeOfCaller.getCallSignatures();
        if (higherLevelFnTypeOfCaller.isUnion()) {
          // If there's more than one call type... it's just too complex for the moment to handle
          const firstCallableType = higherLevelFnTypeOfCaller
            .getUnionTypes()
            .find((t) => t.getCallSignatures().length > 0);
          if (firstCallableType) {
            const callSignatures = firstCallableType.getCallSignatures();
            if (callSignatures.length > 0) {
              return callSignatures[0]
                .getParameters()
                .map((p) => createTypeModelFromType(p.getTypeAtLocation(functionCalled), ref));
            }
          }
        }

        if (callSignatures.length > 0) {
          return callSignatures[0]
            .getParameters()
            .map((p) => createTypeModelFromType(p.getTypeAtLocation(functionCalled), ref));
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
    if (Node.isPropertySignature(variableDeclaration)) {
      return variableDeclaration;
    } else if (Node.isTypeAliasDeclaration(variableDeclaration)) {
      return variableDeclaration;
    } else {
      return null;
    }
  } else {
    cannotHappen(functionDeclaration);
  }
}
