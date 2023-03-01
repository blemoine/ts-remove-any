import { Node, VariableDeclaration } from "ts-morph";
import { computeTypesFromList, filterUnusableTypes, isImplicitAny } from "./type.utils";
import { noopRevertableOperation, RevertableOperation } from "./revert-operation";

export function removeAnyInLetDeclaration(variableDeclaration: VariableDeclaration): RevertableOperation {
  if (!isImplicitAny(variableDeclaration)) {
    return noopRevertableOperation;
  }

  const typesOfSets = variableDeclaration.findReferencesAsNodes().map((ref) => {
    const parent = ref.getParent();
    if (!parent || !Node.isBinaryExpression(parent)) {
      return null;
    }

    if (parent.getOperatorToken().getText() !== "=") {
      return null;
    }

    return parent.getRight().getType() ?? null;
  });

  const newType = computeTypesFromList(filterUnusableTypes(typesOfSets));

  if (newType) {
    variableDeclaration.setType(newType);
    return {
      countChangesDone: 1,
      revert() {
        variableDeclaration.removeType();
      },
    };
  }
  return noopRevertableOperation;
}
