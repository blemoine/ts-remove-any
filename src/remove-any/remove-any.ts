import { SourceFile } from "ts-morph";
import { removeAnyInFunction } from "./remove-any-in-function-parameters";
import { sum } from "../utils/array.utils";
import { removeAnyInLetDeclaration } from "./remove-any-in-let-declaration";
import { RevertableOperation } from "./revert-operation";

export function removeAny(sourceFile: SourceFile): number {
  if (sourceFile.getBaseName().endsWith("js")) {
    return 0;
  }
  const resultsInFunctions = sourceFile
    .getFunctions()
    .map((sourceFn) => revertableOperation(sourceFile, () => removeAnyInFunction(sourceFn)));

  const resultsInLets = sourceFile
    .getVariableDeclarations()
    .map((variableDeclaration) =>
      revertableOperation(sourceFile, () => removeAnyInLetDeclaration(variableDeclaration))
    );

  return sum(resultsInFunctions) + sum(resultsInLets);
}

function revertableOperation(sourceFile: SourceFile, revertableFn: () => RevertableOperation) {
  const preChangeDiagnostic = sourceFile.getPreEmitDiagnostics();
  const result = revertableFn();
  const postChangeDiagnostic = sourceFile.getPreEmitDiagnostics();
  if (postChangeDiagnostic.length > preChangeDiagnostic.length) {
    console.warn(`Reverting ${sourceFile.getBaseName()}`);
    result.revert();
    return 0;
  }

  return result.countChangesDone;
}
