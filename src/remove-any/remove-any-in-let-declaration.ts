import { VariableDeclaration } from "ts-morph";
import { computeTypesFromList, filterUnusableTypes, isImplicitAny } from "./type.utils";
import { noopRevertableOperation, RevertableOperation } from "./revert-operation";
import { allTypesOfRefs } from "./type-unifier";

export function removeAnyInLetDeclaration(variableDeclaration: VariableDeclaration): RevertableOperation {
  if (!isImplicitAny(variableDeclaration)) {
    return noopRevertableOperation;
  }

  const typesOfSets = allTypesOfRefs(variableDeclaration);

  const newType = computeTypesFromList(filterUnusableTypes(typesOfSets));

  if (newType) {
    variableDeclaration.setType(newType);
    return {
      countChangesDone: 1,
      countOfAnys: 1,
      revert() {
        variableDeclaration.removeType();
      },
    };
  }
  return { countChangesDone: 0, countOfAnys: 1, revert() {} };
}
