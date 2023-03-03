import { FunctionDeclaration, Node, ParameterDeclaration } from "ts-morph";
import {
  computeTypesFromList,
  filterUnusableTypes,
  findTypeFromRefUsage,
  findTypesFromCallSite,
  isImplicitAny,
} from "./type.utils";
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
  const callsiteTypes = findTypesFromCallSite(sourceFn, parametersIdx);

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
        try {
          parametersFn.setType(newType);
          return {
            countChangesDone: 1,
            revert() {
              parametersFn.removeType();
            },
          };
        } catch (e) {
          console.error("Unexpected error, please notify ts-remove-any maintainer", e);
          return noopRevertableOperation;
        }
      }
      return noopRevertableOperation;
    })
    .reduce((a, b) => concatRevertableOperation(a, b), noopRevertableOperation);
}
