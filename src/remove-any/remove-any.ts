import { SourceFile } from "ts-morph";
import { removeAnyInFunction } from "./remove-any-in-function-parameters";
import { sum } from "../utils/array.utils";
import { removeAnyInLetDeclaration } from "./remove-any-in-let-declaration";
import { RevertableOperation } from "./revert-operation";

interface RemoveAnyOptions {
  noReverts: boolean;
  verbose: boolean;
}

export function removeAny(sourceFile: SourceFile, options?: Partial<RemoveAnyOptions>): number {
  if (sourceFile.getBaseName().endsWith("js")) {
    return 0;
  }
  const noReverts = options?.noReverts ?? false;
  const verbose = options?.verbose ?? false;

  const resultsInFunctions = sourceFile
    .getFunctions()
    .map((sourceFn) => revertableOperation(sourceFile, { noReverts, verbose }, () => removeAnyInFunction(sourceFn)));

  const resultsInLets = sourceFile
    .getVariableDeclarations()
    .map((variableDeclaration) =>
      revertableOperation(sourceFile, { noReverts, verbose }, () => removeAnyInLetDeclaration(variableDeclaration))
    );

  return sum(resultsInFunctions) + sum(resultsInLets);
}

function revertableOperation(
  sourceFile: SourceFile,
  { verbose, noReverts }: RemoveAnyOptions,
  revertableFn: () => RevertableOperation
) {
  if (noReverts) {
    return revertableFn().countChangesDone;
  }
  const preChangeDiagnostic = sourceFile.getPreEmitDiagnostics();
  const result = revertableFn();
  const postChangeDiagnostic = sourceFile.getPreEmitDiagnostics();
  if (postChangeDiagnostic.length > preChangeDiagnostic.length) {
    if (verbose) {
      console.warn(`Reverting ${result.countChangesDone} changes in ${sourceFile.getBaseName()}`);
      postChangeDiagnostic.forEach((diagnostic) => {
        console.info(diagnostic.getMessageText());
      });
    }
    result.revert();
    return 0;
  }

  return result.countChangesDone;
}
