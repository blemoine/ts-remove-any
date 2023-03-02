import { FunctionDeclaration, Identifier, Node, ParameterDeclaration, PropertyAccessExpression, Type } from "ts-morph";
import { computeTypesFromList, filterUnusableTypes, isImplicitAny } from "./type.utils";
import { concatRevertableOperation, noopRevertableOperation, RevertableOperation } from "./revert-operation";
import { isNotNil } from "../utils/is-not-nil";

function getParameterComputedType(
  parametersFn: ParameterDeclaration,
  sourceFn: FunctionDeclaration,
  parametersIdx: number
): string | null {
  const parameterTypeProperties = parametersFn.getType().getProperties();
  if (!parametersFn.getTypeNode() && parameterTypeProperties.some((p) => p.getTypeAtLocation(parametersFn).isAny())) {
    const propertyTypePairs = parametersFn.getChildren().flatMap((child) => {
      if (Node.isObjectBindingPattern(child)) {
        return child
          .getElements()
          .map((element) => {
            let type: string | null;
            if (element.getType().isAny()) {
              const typesFromUsage = element.findReferencesAsNodes().flatMap((ref) => {
                return findTypeFromRefUsage(ref);
              });
              type = computeTypesFromList(filterUnusableTypes(typesFromUsage));
            } else {
              type = element.getType().getText();
            }

            return type ? ({ propertyName: element.getName(), type } as const) : null;
          })
          .filter(isNotNil);
      }
      return [];
    });

    if (propertyTypePairs.length > 0) {
      return `{${propertyTypePairs
        .map(({ propertyName, type }) => {
          return `${propertyName}: ${type}`;
        })
        .join(",")}}`;
    }
  }

  if (!isImplicitAny(parametersFn)) {
    return null;
  }
  const sourceName = sourceFn.getName();
  const callsiteTypes = sourceFn.findReferencesAsNodes().flatMap((ref): Type[] => {
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
  });

  const result = computeTypesFromList(filterUnusableTypes(callsiteTypes));
  if (!result) {
    const typesFromUsage = parametersFn.findReferencesAsNodes().flatMap((ref) => {
      return findTypeFromRefUsage(ref);
    });
    return computeTypesFromList(filterUnusableTypes(typesFromUsage));
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

function findTypeFromRefUsage(ref: Node): Type[] {
  const parent = ref.getParent();
  if (Node.isVariableDeclaration(parent)) {
    const declarations = parent.getVariableStatement()?.getDeclarations();

    return (declarations ?? [])?.map((d) => d.getType());
  }
  if (Node.isCallExpression(parent)) {
    const children = parent.getChildren();
    if (children.length > 0) {
      const firstChildren = children[0];

      const idxOfCallParameter = parent.getArguments().indexOf(ref);
      if (firstChildren instanceof Identifier) {
        return firstChildren
          .getType()
          .getCallSignatures()
          .map((s) => s.getParameters()[idxOfCallParameter]?.getTypeAtLocation(firstChildren));
      }
      if (firstChildren instanceof PropertyAccessExpression) {
        return firstChildren
          .getType()
          .getCallSignatures()
          .flatMap((signature) => {
            const parameters = signature.getParameters();

            return parameters[idxOfCallParameter]?.getTypeAtLocation(firstChildren);
          });
      }
    }
  }
  return [];
}
