import { FunctionDeclaration, ParameterDeclaration } from "ts-morph";
import {
  computeDestructuredTypes,
  computeTypesFromList,
  filterUnusableTypes,
  findTypeFromRefUsage,
  findTypesFromCallSite,
  isImplicitAny,
} from "./type.utils";
import { concatRevertableOperation, noopRevertableOperation, RevertableOperation } from "./revert-operation";

function getParameterComputedType(
  parametersFn: ParameterDeclaration,
  sourceFn: FunctionDeclaration,
  parametersIdx: number
): string | null {
  const destructuredType = computeDestructuredTypes(parametersFn);
  if (destructuredType) {
    return destructuredType;
  }

  if (!isImplicitAny(parametersFn)) {
    return null;
  }
  const callsiteTypes = findTypesFromCallSite(sourceFn, parametersIdx);

  const result = computeTypesFromList(filterUnusableTypes(callsiteTypes));
  if (!result) {
    const typesFromUsage = parametersFn.findReferencesAsNodes().flatMap((ref) => {
      return findTypeFromRefUsage(ref);
    });
    return computeTypesFromList(filterUnusableTypes(typesFromUsage));
  }

  return result;
}

export function removeAnyInFunction(sourceFn: FunctionDeclaration): RevertableOperation {
  return sourceFn
    .getParameters()
    .map((parametersFn, parametersIdx) => {
      const newType = getParameterComputedType(parametersFn, sourceFn, parametersIdx);

      if (newType) {
        try {
          parametersFn.setType(newType);
          return {
            countChangesDone: 1,
            revert() {
              parametersFn.removeType();
            },
          };
        } catch (e) {
          console.error("Unexpected error, please notify ts-remove-any maintainer", e);
          return noopRevertableOperation;
        }
      }
      return noopRevertableOperation;
    })
    .reduce((a, b) => concatRevertableOperation(a, b), noopRevertableOperation);
}
