import { VariableDeclaration } from "ts-morph";
import { computeTypesFromList, filterUnusableTypes, findTypesOfVariableUsage, isImplicitAny } from "./type.utils";
import { noopRevertableOperation, RevertableOperation } from "./revert-operation";

export function removeAnyInLetDeclaration(variableDeclaration: VariableDeclaration): RevertableOperation {
  if (!isImplicitAny(variableDeclaration)) {
    return noopRevertableOperation;
  }

  const typesOfSets = findTypesOfVariableUsage(variableDeclaration);

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
