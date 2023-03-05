import { ArrowFunction, ConstructorDeclaration, FunctionDeclaration, SourceFile, VariableDeclaration } from "ts-morph";
import { removeAnyInFunction } from "./remove-any-in-function-parameters";
import { sum } from "../utils/array.utils";
import { removeAnyInLetDeclaration } from "./remove-any-in-let-declaration";
import { RevertableOperation } from "./revert-operation";
import { removeAnyInArrowFunction } from "./remove-any-in-arrow-function-parameters";
import { removeAnyInClassesConstructor } from "./remove-any-classes";

interface RemoveAnyOptions {
  noReverts: boolean;
  verbosity: number;
}

export function removeAny(
  sourceFile: SourceFile,
  options?: Partial<RemoveAnyOptions>
): { countOfAnys: number; countChangesDone: number } {
  if (sourceFile.getBaseName().endsWith("js")) {
    return { countOfAnys: 0, countChangesDone: 0 };
  }
  const noReverts = options?.noReverts ?? false;
  const verbosity = options?.verbosity ?? 0;

  const variableDeclarations: VariableDeclaration[] = [];
  const functions: FunctionDeclaration[] = [];
  const arrowFunctions: ArrowFunction[] = [];
  const constructorDeclarations: ConstructorDeclaration[] = [];
  sourceFile.forEachDescendant((node) => {
    if (node instanceof VariableDeclaration) {
      variableDeclarations.push(node);
    } else if (node instanceof FunctionDeclaration) {
      functions.push(node);
    } else if (node instanceof ArrowFunction) {
      arrowFunctions.push(node);
    } else if (node instanceof ConstructorDeclaration) {
      constructorDeclarations.push(node);
    }
  });

  const validatedOptions = { noReverts, verbosity };
  const resultsInFunctions = functions.map((sourceFn) =>
    revertableOperation(sourceFile, validatedOptions, () => removeAnyInFunction(sourceFn))
  );
  const resultsInArrowFunctions = arrowFunctions.map((sourceFn) =>
    revertableOperation(sourceFile, validatedOptions, () => removeAnyInArrowFunction(sourceFn))
  );

  const resultsInLets = variableDeclarations.map((variableDeclaration) =>
    revertableOperation(sourceFile, validatedOptions, () => removeAnyInLetDeclaration(variableDeclaration))
  );

  const resultsInConstructors = constructorDeclarations.map((constructorDeclaration) =>
    revertableOperation(sourceFile, validatedOptions, () => removeAnyInClassesConstructor(constructorDeclaration))
  );

  const aggregatedResults = [
    ...resultsInFunctions,
    ...resultsInLets,
    ...resultsInArrowFunctions,
    ...resultsInConstructors,
  ];

  return {
    countChangesDone: sum(aggregatedResults.map((r) => r.countChangesDone)),
    countOfAnys: sum(aggregatedResults.map((r) => r.countOfAnys)),
  };
}

function revertableOperation(
  sourceFile: SourceFile,
  { verbosity, noReverts }: RemoveAnyOptions,
  revertableFn: () => RevertableOperation
): { countOfAnys: number; countChangesDone: number } {
  if (noReverts) {
    const revertResult = revertableFn();
    return { countOfAnys: revertResult.countOfAnys, countChangesDone: revertResult.countChangesDone };
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
    return { countOfAnys: result.countOfAnys, countChangesDone: 0 };
  }

  return { countOfAnys: result.countOfAnys, countChangesDone: result.countChangesDone };
}
