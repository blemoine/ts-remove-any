import { VariableDeclaration } from "ts-morph";
import {
  computeTypesFromRefs,
  filterUnusableTypes,
  isImplicitAny,
  isImplicitAnyArray,
  setTypeOnNode,
} from "./type.utils";
import { noopRevertableOperation, RevertableOperation } from "./revert-operation";
import { allTypesOfRefs } from "./type-unifier";

export function removeAnyInLetDeclaration(variableDeclaration: VariableDeclaration): RevertableOperation {
  if (!isImplicitAny(variableDeclaration) && !isImplicitAnyArray(variableDeclaration)) {
    return noopRevertableOperation;
  }

  const typesOfSets = allTypesOfRefs(variableDeclaration);

  const newType = computeTypesFromRefs(filterUnusableTypes([{ types: typesOfSets, nullable: false }]));

  if (newType) {
    return setTypeOnNode(variableDeclaration, newType);
  }
  return { countChangesDone: 0, countOfAnys: 1, revert() {} };
}
