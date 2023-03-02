import { FunctionDeclaration, SourceFile, VariableDeclaration } from "ts-morph";
import { removeAnyInFunction } from "./remove-any-in-function-parameters";
import { sum } from "../utils/array.utils";
import { removeAnyInLetDeclaration } from "./remove-any-in-let-declaration";
import { RevertableOperation } from "./revert-operation";

interface RemoveAnyOptions {
  noReverts: boolean;
  verbosity: number;
}

export function removeAny(sourceFile: SourceFile, options?: Partial<RemoveAnyOptions>): number {
  if (sourceFile.getBaseName().endsWith("js")) {
    return 0;
  }
  const noReverts = options?.noReverts ?? false;
  const verbosity = options?.verbosity ?? 0;

  const variableDeclarations: VariableDeclaration[] = [];
  const functions: FunctionDeclaration[] = [];
  sourceFile.forEachDescendant((d) => {
    if (d instanceof VariableDeclaration) {
      variableDeclarations.push(d);
    } else if (d instanceof FunctionDeclaration) {
      functions.push(d);
    }
  });

  const validatedOptions = { noReverts, verbosity };
  const resultsInFunctions = functions.map((sourceFn) =>
    revertableOperation(sourceFile, validatedOptions, () => removeAnyInFunction(sourceFn))
  );

  const resultsInLets = variableDeclarations.map((variableDeclaration) =>
    revertableOperation(sourceFile, validatedOptions, () => removeAnyInLetDeclaration(variableDeclaration))
  );

  return sum(resultsInFunctions) + sum(resultsInLets);
}

function revertableOperation(
  sourceFile: SourceFile,
  { verbosity, noReverts }: RemoveAnyOptions,
  revertableFn: () => RevertableOperation
) {
  if (noReverts) {
    return revertableFn().countChangesDone;
  }
  const preChangeDiagnostic = sourceFile.getPreEmitDiagnostics();
  const result = revertableFn();
  const postChangeDiagnostic = sourceFile.getPreEmitDiagnostics();
  if (postChangeDiagnostic.length > preChangeDiagnostic.length) {
    if (verbosity > 0) {
      console.warn(`Reverting ${result.countChangesDone} changes in ${sourceFile.getBaseName()}`);
      postChangeDiagnostic.forEach((diagnostic) => {
        if (verbosity > 1) {
          console.info(diagnostic.getMessageText());
        }
      });
    }
    result.revert();
    return 0;
  }

  return result.countChangesDone;
}
