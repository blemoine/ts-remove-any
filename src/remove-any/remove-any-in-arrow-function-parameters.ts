import { ArrowFunction, Node, ParameterDeclaration } from "ts-morph";
import { concatRevertableOperation, noopRevertableOperation, RevertableOperation } from "./revert-operation";
import {
  computeDestructuredTypes,
  ComputedType,
  computeTypesFromList,
  filterUnusableTypes,
  findTypeFromRefUsage,
  findTypesFromCallSite,
  isImplicitAny,
} from "./type.utils";
import { cannotHappen } from "../utils/cannot-happen";

function getParameterComputedType(
  parametersFn: ParameterDeclaration,
  sourceFn: ArrowFunction,
  parametersIdx: number
): ComputedType {
  const destructuredType = computeDestructuredTypes(parametersFn);
  if (destructuredType) {
    return { kind: "type_found", type: destructuredType };
  }

  if (!isImplicitAny(parametersFn)) {
    return { kind: "no_any" };
  }

  const parentDeclaration = sourceFn.getParent();

  if (!Node.isVariableDeclaration(parentDeclaration)) {
    return { kind: "no_type_found" };
  }

  const callsiteTypes = findTypesFromCallSite(parentDeclaration, parametersIdx);
  const result = computeTypesFromList(filterUnusableTypes(callsiteTypes));
  if (result) {
    return { kind: "type_found", type: result };
  }

  const typesFromUsage = parametersFn.findReferencesAsNodes().flatMap((ref) => {
    return findTypeFromRefUsage(ref);
  });
  const typesFromList = computeTypesFromList(filterUnusableTypes(typesFromUsage));
  return typesFromList ? { kind: "type_found", type: typesFromList } : { kind: "no_type_found" };
}

export function removeAnyInArrowFunction(sourceFn: ArrowFunction): RevertableOperation {
  return sourceFn
    .getParameters()
    .map((parametersFn, parametersIdx) => {
      const newType = getParameterComputedType(parametersFn, sourceFn, parametersIdx);

      if (newType.kind === "type_found") {
        try {
          parametersFn.setType(newType.type);
          return {
            countChangesDone: 1,
            countOfAnys: 1,
            revert() {
              parametersFn.removeType();
            },
          };
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
