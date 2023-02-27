import { Node, FunctionDeclaration, ParameterDeclaration } from "ts-morph";
import { isNotNil } from "../utils/is-not-nil";
import { computeTypesFromList, isImplicitAny } from "./type.utils";
import { concatRevertableOperation, noopRevertableOperation, RevertableOperation } from "./revert-operation";

function getParameterComputedType(
  parametersFn: ParameterDeclaration,
  sourceFn: FunctionDeclaration,
  parametersIdx: number
): string | null {
  if (!isImplicitAny(parametersFn)) {
    return null;
  }

  const callsiteTypes = sourceFn
    .findReferencesAsNodes()
    .map((ref) => {
      const parent = ref.getParent();
      if (Node.isCallExpression(parent)) {
        const argument = parent.getArguments()[parametersIdx];
        return argument?.getType();
      } else {
        return null;
      }
    })
    .filter(isNotNil)
    .filter((t) => !t.isAny() && !t.getText().includes("any[]") && !t.getText().includes(": any"))
    .filter((t) => !t.getText().startsWith("import("));

  return computeTypesFromList(callsiteTypes);
}

export function removeAnyInFunction(sourceFn: FunctionDeclaration): RevertableOperation {
  return sourceFn
    .getParameters()
    .map((parametersFn, parametersIdx) => {
      const newType = getParameterComputedType(parametersFn, sourceFn, parametersIdx);
      if (newType) {
        parametersFn.setType(newType);
        return {
          countChangesDone: 1,
          revert() {
            parametersFn.removeType();
          },
        };
      }
      return noopRevertableOperation;
    })
    .reduce((a, b) => concatRevertableOperation(a, b), noopRevertableOperation);
}
