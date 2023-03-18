import { VariableDeclaration } from "ts-morph";
import {
  computeTypesFromRefs,
  filterUnusableTypes,
  isAny,
  isAnyArray,
  isImplicitAny,
  isImplicitAnyArray,
  setTypeOnNode,
} from "./type.utils";
import { noopRevertableOperation, RevertableOperation } from "./revert-operation";
import { allTypesOfRefs } from "./type-unifier";

interface RemoveAnyOptions {
  explicit: boolean;
}

export function removeAnyInLetDeclaration(
  variableDeclaration: VariableDeclaration,
  { explicit }: RemoveAnyOptions
): RevertableOperation {
  if (!explicit && !isImplicitAny(variableDeclaration) && !isImplicitAnyArray(variableDeclaration)) {
    return noopRevertableOperation;
  }
  if (explicit && !isAny(variableDeclaration) && !isAnyArray(variableDeclaration)) {
    return noopRevertableOperation;
  }

  const typesOfSets = allTypesOfRefs(variableDeclaration);

  const newType = computeTypesFromRefs(filterUnusableTypes([typesOfSets]));

  if (newType) {
    return setTypeOnNode(variableDeclaration, newType);
  }
  return { countChangesDone: 0, countOfAnys: 1, revert() {} };
}
