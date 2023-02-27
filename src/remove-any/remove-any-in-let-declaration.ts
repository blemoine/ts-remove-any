import { Node, VariableDeclaration } from "ts-morph";
import { computeTypesFromList, isImplicitAny } from "./type.utils";
import { isNotNil } from "../utils/is-not-nil";
import { noopRevertableOperation, RevertableOperation } from "./revert-operation";

export function removeAnyInLetDeclaration(variableDeclaration: VariableDeclaration): RevertableOperation {
  if (!isImplicitAny(variableDeclaration)) {
    return noopRevertableOperation;
  }

  const typesOfSets = variableDeclaration
    .findReferencesAsNodes()
    .map((ref) => {
      const parent = ref.getParent();
      if (!parent || !Node.isBinaryExpression(parent)) {
        return null;
      }

      if (parent.getOperatorToken().getText() !== "=") {
        return null;
      }

      return parent.getRight().getType() ?? null;
    })
    .filter(isNotNil)
    .filter((t) => !t.isAny() && !t.getText().includes("any[]") && !t.getText().includes(": any"))
    .filter((t) => !t.getText().startsWith("import("));

  const newType = computeTypesFromList(typesOfSets);

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
