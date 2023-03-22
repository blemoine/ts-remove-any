import { ParameterDeclaration, SourceFile, VariableDeclaration, Node } from "ts-morph";
import { sum } from "../utils/array.utils";
import { removeAnyInLetDeclaration } from "./remove-any-in-let-declaration";
import { RevertableOperation } from "./revert-operation";
import { removeAnyInParametersFn } from "./remove-any-in-parameters-declaration";

interface RemoveAnyOptions {
  noReverts: boolean;
  verbosity: number;
  explicit: boolean;
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
  const explicit = options?.explicit ?? false;

  const variableDeclarations: VariableDeclaration[] = [];
  const parametersDeclaration: ParameterDeclaration[] = [];

  sourceFile.forEachDescendant((node) => {
    if (node instanceof ParameterDeclaration) {
      parametersDeclaration.push(node);
    } else if (node instanceof VariableDeclaration) {
      variableDeclarations.push(node);
    }
  });

  const validatedOptions = { noReverts, verbosity, explicit };
  const resultsInParameters = parametersDeclaration
    .filter((p) => !Node.isCatchClause(p.getParent()))
    .map((parameters) => {
      return revertableOperation(sourceFile, validatedOptions, () =>
        removeAnyInParametersFn(parameters, validatedOptions)
      );
    });

  const resultsInLets = variableDeclarations
    .filter((p) => !Node.isCatchClause(p.getParent()))
    .map((variableDeclaration) =>
      revertableOperation(sourceFile, validatedOptions, () =>
        removeAnyInLetDeclaration(variableDeclaration, validatedOptions)
      )
    );

  const aggregatedResults = [...resultsInLets, ...resultsInParameters];

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
