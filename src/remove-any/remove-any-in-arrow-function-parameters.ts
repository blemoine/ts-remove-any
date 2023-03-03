import { ArrowFunction, Node, ParameterDeclaration } from "ts-morph";
import { concatRevertableOperation, noopRevertableOperation, RevertableOperation } from "./revert-operation";
import {
  computeDestructuredTypes,
  computeTypesFromList,
  filterUnusableTypes,
  findTypeFromRefUsage,
  findTypesFromCallSite,
  isImplicitAny,
} from "./type.utils";

function getParameterComputedType(
  parametersFn: ParameterDeclaration,
  sourceFn: ArrowFunction,
  parametersIdx: number
): string | null {
  const destructuredType = computeDestructuredTypes(parametersFn);
  if (destructuredType) {
    return destructuredType;
  }

  if (!isImplicitAny(parametersFn)) {
    return null;
  }

  const parentDeclaration = sourceFn.getParent();

  if (!Node.isVariableDeclaration(parentDeclaration)) {
    return null;
  }

  const callsiteTypes = findTypesFromCallSite(parentDeclaration, parametersIdx);
  const result = computeTypesFromList(filterUnusableTypes(callsiteTypes));
  if (!result) {
    const typesFromUsage = parametersFn.findReferencesAsNodes().flatMap((ref) => {
      return findTypeFromRefUsage(ref);
    });
    return computeTypesFromList(filterUnusableTypes(typesFromUsage));
  }
  return result;
}

export function removeAnyInArrowFunction(sourceFn: ArrowFunction): RevertableOperation {
  return sourceFn
    .getParameters()
    .map((parametersFn, parametersIdx) => {
      const newType = getParameterComputedType(parametersFn, sourceFn, parametersIdx);

      if (newType) {
        try {
          parametersFn.setType(newType);
          return {
            countChangesDone: 1,
            countOfAnys: 1,
            revert() {
              parametersFn.removeType();
            },
          };
        } catch (e) {
          console.error("Unexpected error, please notify ts-remove-any maintainer", e);
        }
      }
      return { countChangesDone: 0, countOfAnys: 1, revert() {} };
    })
    .reduce((a, b) => concatRevertableOperation(a, b), noopRevertableOperation);
}
