import { CallExpression, FunctionDeclaration, SourceFile } from "ts-morph";

function removeAnyInFunction(sourceFn: FunctionDeclaration) {
  sourceFn.getParameters().forEach((parametersFn, parametersIdx) => {
    const isAny = parametersFn.getType().isAny();
    const declaredType = parametersFn.getTypeNode();
    const isImplicitAny = isAny && !declaredType;

    if (isImplicitAny) {
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
        return;
      }
      if (callsiteTypes.every((s) => s.isBooleanLiteral() || s.isBoolean())) {
        parametersFn.setType("boolean");
      } else if (callsiteTypes.length === 1) {
        parametersFn.setType(callsiteTypes[0].getText());
      } else if (callsiteTypes.length <= 4) {
        const newTypes = [...new Set(callsiteTypes.map((t) => t.getText()))];
        parametersFn.setType(newTypes.join(" | "));
      } else {
        if (callsiteTypes.every((t) => t.isNumber() || t.isNumberLiteral())) {
          parametersFn.setType("number");
        } else if (callsiteTypes.every((t) => t.isString() || t.isStringLiteral())) {
          parametersFn.setType("string");
        }
      }
    }
  });
}

export function removeAny(sourceFile: SourceFile): void {
  if (sourceFile.getBaseName().endsWith("js")) {
    return;
  }
  sourceFile.getFunctions().forEach((sourceFn) => {
    removeAnyInFunction(sourceFn);
  });
}

function isNotNil<T>(x: T | null | undefined): x is T {
  return x !== null && x !== undefined;
}
