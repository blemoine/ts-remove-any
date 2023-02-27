import { SourceFile } from "ts-morph";
import { removeAnyInFunction } from "./remove-any-in-function-parameters";
import { sum } from "../utils/array.utils";
import { removeAnyInLetDeclaration } from "./remove-any-in-let-declaration";

export function removeAny(sourceFile: SourceFile): number {
  if (sourceFile.getBaseName().endsWith("js")) {
    return 0;
  }
  const resultsInFunctions = sourceFile.getFunctions().map((sourceFn) => {
    const result = removeAnyInFunction(sourceFn);
    const diagnostic = sourceFile.getPreEmitDiagnostics();
    if (diagnostic.length > 0) {
      result.revert();
      return 0;
    }

    return result.countChangesDone;
  });

  const resultsInLets = sourceFile.getVariableDeclarations().map((variableDeclaration) => {
    const result = removeAnyInLetDeclaration(variableDeclaration);
    const diagnostic = sourceFile.getPreEmitDiagnostics();
    if (diagnostic.length > 0) {
      result.revert();
      return 0;
    }

    return result.countChangesDone;
  });

  return sum(resultsInFunctions) + sum(resultsInLets);
}
