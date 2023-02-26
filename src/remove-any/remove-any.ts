import { SourceFile } from "ts-morph";
import { removeAnyInFunction } from "./remove-any-in-function-parameters";
import { sum } from "../utils/array.utils";
import { removeAnyInLetDeclaration } from "./remove-any-in-let-declaration";

export function removeAny(sourceFile: SourceFile): number {
  if (sourceFile.getBaseName().endsWith("js")) {
    return 0;
  }
  const resultsInFunctions = sourceFile.getFunctions().map((sourceFn) => {
    return removeAnyInFunction(sourceFn);
  });

  const resultsInLets = sourceFile.getVariableDeclarations().map((variableDeclaration) => {
    return removeAnyInLetDeclaration(variableDeclaration);
  });

  return sum(resultsInFunctions) + sum(resultsInLets);
}
