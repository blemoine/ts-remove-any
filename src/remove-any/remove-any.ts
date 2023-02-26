import { CallExpression, FunctionDeclaration, SourceFile } from "ts-morph";

function removeAnyInFunction(sourceFn: FunctionDeclaration): number {
  return sourceFn
    .getParameters()
    .map((parametersFn, parametersIdx) => {
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
          return null;
        }
        let newType: string | null = null;
        if (callsiteTypes.every((s) => s.isBooleanLiteral() || s.isBoolean())) {
          newType = "boolean";
        } else if (callsiteTypes.length === 1) {
          newType = callsiteTypes[0].getText();
        } else if (callsiteTypes.length <= 4) {
          const newTypes = [...new Set(callsiteTypes.map((t) => t.getText()))];
          newType = newTypes.join(" | ");
        } else {
          if (callsiteTypes.every((t) => t.isNumber() || t.isNumberLiteral())) {
            newType = "number";
          } else if (callsiteTypes.every((t) => t.isString() || t.isStringLiteral())) {
            newType = "string";
          }
        }

        if (newType) {
          parametersFn.setType(newType);
        }
        return newType;
      }
      return null;
    })
    .filter(isNotNil).length;
}

export function removeAny(sourceFile: SourceFile): number {
  if (sourceFile.getBaseName().endsWith("js")) {
    return 0;
  }
  return sourceFile
    .getFunctions()
    .map((sourceFn) => {
      return removeAnyInFunction(sourceFn);
    })
    .reduce((a, b) => a + b, 0);
}

function isNotNil<T>(x: T | null | undefined): x is T {
  return x !== null && x !== undefined;
}
