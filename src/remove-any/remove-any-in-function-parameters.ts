import { CallExpression, FunctionDeclaration, ParameterDeclaration } from "ts-morph";
import { isNotNil } from "../utils/is-not-nil";

function getParameterComputedType(
  parametersFn: ParameterDeclaration,
  sourceFn: FunctionDeclaration,
  parametersIdx: number
): string | null {
  const isAny = parametersFn.getType().isAny();
  const declaredType = parametersFn.getTypeNode();
  const isImplicitAny = isAny && !declaredType;

  if (!isImplicitAny) {
    return null;
  }

  const callsiteTypes = sourceFn
    .findReferencesAsNodes()
    .map((ref) => {
      const parent = ref.getParent();
      if (parent instanceof CallExpression) {
        const argument = parent.getArguments()[parametersIdx];
        return argument?.getType();
      } else {
        return null;
      }
    })
    .filter(isNotNil)
    .filter((t) => !t.isAny() && !t.getText().includes("any[]"))
    .filter((t) => !t.getText().startsWith("import(") && !t.getText().startsWith("typeof"));

  if (callsiteTypes.length === 0) {
    return null;
  }
  if (callsiteTypes.every((s) => s.isBooleanLiteral() || s.isBoolean())) {
    return "boolean";
  }
  if (callsiteTypes.length === 1) {
    return callsiteTypes[0].getText();
  }
  if (callsiteTypes.length <= 4) {
    if (callsiteTypes.every((t) => t.isNumber() || t.isNumberLiteral()) && callsiteTypes.some((t) => t.isNumber())) {
      return "number";
    }
    if (callsiteTypes.every((t) => t.isString() || t.isStringLiteral()) && callsiteTypes.some((t) => t.isString())) {
      return "string";
    }

    const newTypes = [...new Set(callsiteTypes.map((t) => t.getText()))];
    return newTypes.join(" | ");
  }

  if (callsiteTypes.every((t) => t.isNumber() || t.isNumberLiteral())) {
    return "number";
  } else if (callsiteTypes.every((t) => t.isString() || t.isStringLiteral())) {
    return "string";
  }
  return null;
}

export function removeAnyInFunction(sourceFn: FunctionDeclaration): number {
  return sourceFn
    .getParameters()
    .map((parametersFn, parametersIdx) => {
      const newType = getParameterComputedType(parametersFn, sourceFn, parametersIdx);
      if (newType) {
        parametersFn.setType(newType);
      }
      return newType;
    })
    .filter(isNotNil).length;
}
