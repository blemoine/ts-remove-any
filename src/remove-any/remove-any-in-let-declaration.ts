import { PropertyDeclaration, VariableDeclaration } from "ts-morph";
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
  dryRun: boolean;
}

export function removeAnyInLetDeclaration(
  variableDeclaration: VariableDeclaration | PropertyDeclaration,
  { explicit, dryRun }: RemoveAnyOptions
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
    if (dryRun) {
      const filePath = variableDeclaration.getSourceFile().getBaseName();
      console.info(`${filePath} variable \`${variableDeclaration.getText()}\` would got type \`${newType.name}\``);

      return {
        countChangesDone: 0,
        countOfAnys: 1,
        revert() {},
      };
    }
    return setTypeOnNode(variableDeclaration, newType);
  }
  return { countChangesDone: 0, countOfAnys: 1, revert() {} };
}
