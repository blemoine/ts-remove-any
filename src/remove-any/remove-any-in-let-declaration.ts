import { Node, VariableDeclaration } from "ts-morph";
import { computeTypesFromList, isImplicitAny } from "./type.utils";
import { isNotNil } from "../utils/is-not-nil";

export function removeAnyInLetDeclaration(variableDeclaration: VariableDeclaration): number {
  if (!isImplicitAny(variableDeclaration)) {
    return 0;
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
    .filter(isNotNil);

  const newType = computeTypesFromList(typesOfSets);

  if (newType) {
    variableDeclaration.setType(newType);
    return 1;
  }
  return 0;
}
