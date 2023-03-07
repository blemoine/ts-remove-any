import { FunctionDeclaration, ParameterDeclaration } from "ts-morph";
import {
  computeDestructuredTypes,
  ComputedType,
  computeTypesFromList,
  filterUnusableTypes,
  isImplicitAny,
  setTypeOnNode,
} from "./type.utils";
import { concatRevertableOperation, noopRevertableOperation, RevertableOperation } from "./revert-operation";
import { cannotHappen } from "../utils/cannot-happen";
import { allTypesOfRefs } from "./type-unifier";

function getParameterComputedType(parametersFn: ParameterDeclaration): ComputedType {
  const destructuredType = computeDestructuredTypes(parametersFn);
  if (destructuredType) {
    return { kind: "type_found", type: destructuredType };
  }

  if (!isImplicitAny(parametersFn)) {
    return { kind: "no_any" };
  }
  const callsiteTypes = allTypesOfRefs(parametersFn);

  const result = computeTypesFromList(filterUnusableTypes(callsiteTypes));
  if (result) {
    return { kind: "type_found", type: result };
  }
  return { kind: "no_type_found" };
}

export function removeAnyInFunction(sourceFn: FunctionDeclaration): RevertableOperation {
  return sourceFn
    .getParameters()
    .map((parametersFn) => {
      const newType = getParameterComputedType(parametersFn);

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
