import { CallExpression, SourceFile } from "ts-morph";

export function removeAny(sourceFile: SourceFile): void {
  sourceFile.getFunctions().forEach((sourceFn) => {
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
              return argument.getType();
            } else {
              return null;
            }
          })
          .filter(isNotNil);

        if (callsiteTypes.length === 0) {
          return;
        }
        if (callsiteTypes.every((s) => s.isBooleanLiteral() || s.isBoolean())) {
          parametersFn.setType("boolean");
        } else if (callsiteTypes.length === 1) {
          parametersFn.setType(callsiteTypes[0].getText());
        } else if (callsiteTypes.length <= 4) {
          parametersFn.setType(callsiteTypes.map((t) => t.getText()).join(" | "));
        } else {
          if (callsiteTypes.every((t) => t.isNumber() || t.isNumberLiteral())) {
            parametersFn.setType("number");
          } else if (callsiteTypes.every((t) => t.isString() || t.isStringLiteral())) {
            parametersFn.setType("string");
          }
        }
      }
    });
  });
}

function isNotNil<T>(x: T | null | undefined): x is T {
  return x !== null && x !== undefined;
}
