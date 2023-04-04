import { ParameterDeclaration, SourceFile, VariableDeclaration, Node, PropertyDeclaration } from "ts-morph";
import { sum } from "../utils/array.utils";
import { removeAnyInLetDeclaration } from "./remove-any-in-let-declaration";
import { RevertableOperation } from "./revert-operation";
import { removeAnyInParametersFn } from "./remove-any-in-parameters-declaration";

interface RemoveAnyOptions {
  noReverts: boolean;
  verbosity: number;
  explicit: boolean;
  dryRun: boolean;
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
  const dryRun = options?.dryRun ?? false;

  const variableDeclarations: (VariableDeclaration | PropertyDeclaration)[] = [];
  const parametersDeclaration: ParameterDeclaration[] = [];

  sourceFile.forEachDescendant((node) => {
    const nodeParent = node.getParent();
    if (Node.isCatchClause(nodeParent) || isPromiseCatch(nodeParent)) {
      return;
    }

    if (Node.isParameterDeclaration(node)) {
      parametersDeclaration.push(node);
    } else if (Node.isVariableDeclaration(node)) {
      variableDeclarations.push(node);
    } else if (Node.isPropertyDeclaration(node)) {
      variableDeclarations.push(node);
    }
  });

  const validatedOptions = { noReverts, verbosity, explicit, dryRun };
  const resultsInParameters = parametersDeclaration
    .filter((p) => !Node.isCatchClause(p.getParent()))
    .map((parameters) => {
      return revertableOperation(sourceFile, validatedOptions, () => {
        if (verbosity > 2) {
          console.info(`${sourceFile.getBaseName()}: remove any in ${parameters.getText()}`);
        }
        return removeAnyInParametersFn(parameters, validatedOptions);
      });
    });

  const resultsInLets = variableDeclarations
    .filter((p) => !Node.isCatchClause(p.getParent()))
    .map((variableDeclaration) =>
      revertableOperation(sourceFile, validatedOptions, () => {
        if (verbosity > 2) {
          console.info(`${sourceFile.getBaseName()}: remove any in ${variableDeclaration.getText()}`);
        }
        return removeAnyInLetDeclaration(variableDeclaration, validatedOptions);
      })
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

function isPromiseCatch(node: Node | undefined): boolean {
  if (Node.isArrowFunction(node) || Node.isFunctionDeclaration(node) || Node.isFunctionExpression(node)) {
    return isPromiseCatch(node.getParent());
  }
  if (Node.isCallExpression(node)) {
    const expression = node.getExpression();
    if (Node.isPropertyAccessExpression(expression)) {
      return expression.getName() === "catch";
    }
  }
  return false;
}
