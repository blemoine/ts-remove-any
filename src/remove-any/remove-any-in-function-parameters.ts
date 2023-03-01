import { FunctionDeclaration, Identifier, Node, ParameterDeclaration, PropertyAccessExpression, Type } from "ts-morph";
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
  const sourceName = sourceFn.getName();

  const callsiteTypes = sourceFn
    .findReferencesAsNodes()
    .flatMap((ref): Type[] => {
      const parent = ref.getParent();
      if (Node.isCallExpression(parent)) {
        if (sourceName && parent.getText().startsWith(sourceName)) {
          const argument = parent.getArguments()[parametersIdx];
          return [argument?.getType()];
        }
        const children = parent.getChildren();
        if (children.length > 0) {
          const firstChildren = children[0];

          if (firstChildren instanceof Identifier) {
            return firstChildren
              .getType()
              .getCallSignatures()
              .map((s) => s.getParameters()[parametersIdx]?.getTypeAtLocation(firstChildren));
          }
          if (firstChildren instanceof PropertyAccessExpression) {
            const idxOfCallParameter = parent.getArguments().indexOf(ref);

            return firstChildren
              .getType()
              .getCallSignatures()
              .flatMap((signature) => {
                const parameters = signature.getParameters();
                return parameters[idxOfCallParameter]
                  ?.getTypeAtLocation(firstChildren)
                  .getCallSignatures()
                  .map((s) => s.getParameters()[parametersIdx]?.getTypeAtLocation(firstChildren));
              });
          }
        }

        return [];
      }
      return [];
    })
    .filter(isNotNil)
    .filter((t) => !t.isAny() && !t.getText().includes("any[]") && !t.getText().includes(": any"))
    .filter((t) => !t.getText().startsWith("import("));

  const result = computeTypesFromList(callsiteTypes);
  if (!result) {
    const typesFromUsage = parametersFn
      .findReferencesAsNodes()
      .flatMap((ref) => {
        const parent = ref.getParent();
        if (Node.isVariableDeclaration(parent)) {
          const declarations = parent.getVariableStatement()?.getDeclarations();

          return (declarations ?? [])?.map((d) => d.getType());
        }
        if (Node.isCallExpression(parent)) {
          // TODO refactor it's basically duplication
          const children = parent.getChildren();
          if (children.length > 0) {
            const firstChildren = children[0];

            if (firstChildren instanceof Identifier) {
              return firstChildren
                .getType()
                .getCallSignatures()
                .map((s) => s.getParameters()[parametersIdx]?.getTypeAtLocation(firstChildren));
            }
            if (firstChildren instanceof PropertyAccessExpression) {
              const idxOfCallParameter = parent.getArguments().indexOf(ref);

              return firstChildren
                .getType()
                .getCallSignatures()
                .flatMap((signature) => {
                  const parameters = signature.getParameters();
                  return parameters[idxOfCallParameter]
                    ?.getTypeAtLocation(firstChildren)
                    .getCallSignatures()
                    .map((s) => s.getParameters()[parametersIdx]?.getTypeAtLocation(firstChildren));
                });
            }
          }
        }
        return [];
      })
      .filter(isNotNil)
      .filter((t) => !t.isAny() && !t.getText().includes("any[]") && !t.getText().includes(": any"))
      .filter((t) => !t.getText().startsWith("import("));
    return computeTypesFromList(typesFromUsage);
  }
  return result;
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
