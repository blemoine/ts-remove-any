import { ConstructorDeclaration, MethodDeclaration, ParameterDeclaration } from "ts-morph";
import {
  computeDestructuredTypes,
  ComputedType,
  computeTypesFromList,
  filterUnusableTypes,
  findTypeFromRefUsage,
  findTypesFromCallSite,
  isImplicitAny,
  setTypeOnNode,
} from "./type.utils";
import { concatRevertableOperation, noopRevertableOperation, RevertableOperation } from "./revert-operation";
import { cannotHappen } from "../utils/cannot-happen";

function getParameterComputedType(
  parametersFn: ParameterDeclaration,
  sourceFn: ConstructorDeclaration | MethodDeclaration,
  parametersIdx: number
): ComputedType {
  const destructuredType = computeDestructuredTypes(parametersFn);
  if (destructuredType) {
    return { kind: "type_found", type: destructuredType };
  }

  if (!isImplicitAny(parametersFn)) {
    return { kind: "no_any" };
  }
  const callsiteTypes = findTypesFromCallSite(sourceFn, parametersIdx);

  const result = computeTypesFromList(filterUnusableTypes(callsiteTypes));
  if (result) {
    return { kind: "type_found", type: result };
  }
  const typesFromUsage = parametersFn.findReferencesAsNodes().flatMap((ref) => {
    return findTypeFromRefUsage(ref);
  });
  const computedType = computeTypesFromList(filterUnusableTypes(typesFromUsage));
  return computedType ? { kind: "type_found", type: computedType } : { kind: "no_type_found" };
}

export function removeAnyInClassesConstructor(sourceFn: ConstructorDeclaration): RevertableOperation {
  return sourceFn
    .getParameters()
    .map((parametersFn, parametersIdx) => {
      const newType = getParameterComputedType(parametersFn, sourceFn, parametersIdx);

      if (newType.kind === "type_found") {
        try {
          return setTypeOnNode(parametersFn, newType.type);
        } catch (e) {
          console.error("Unexpected error, please notify ts-remove-any maintainer", e);
          return { countChangesDone: 0, countOfAnys: 1, revert() {} };
        }
      } else if (newType.kind === "no_type_found") {
        return { countChangesDone: 0, countOfAnys: 1, revert() {} };
      } else if (newType.kind === "no_any") {
        return noopRevertableOperation;
      } else {
        cannotHappen(newType);
      }
    })
    .reduce((a, b) => concatRevertableOperation(a, b), noopRevertableOperation);
}

export function removeAnyInMethodDeclaration(sourceFn: MethodDeclaration): RevertableOperation {
  return sourceFn
    .getParameters()
    .map((parametersFn, parametersIdx) => {
      const newType = getParameterComputedType(parametersFn, sourceFn, parametersIdx);

      if (newType.kind === "type_found") {
        try {
          return setTypeOnNode(parametersFn, newType.type);
        } catch (e) {
          console.error("Unexpected error, please notify ts-remove-any maintainer", e);
          return { countChangesDone: 0, countOfAnys: 1, revert() {} };
        }
      } else if (newType.kind === "no_type_found") {
        return { countChangesDone: 0, countOfAnys: 1, revert() {} };
      } else if (newType.kind === "no_any") {
        return noopRevertableOperation;
      } else {
        cannotHappen(newType);
      }
    })
    .reduce((a, b) => concatRevertableOperation(a, b), noopRevertableOperation);
}
