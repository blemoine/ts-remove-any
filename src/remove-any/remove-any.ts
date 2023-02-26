import { SourceFile } from "ts-morph";
import { removeAnyInFunction } from "./remove-any-in-function-parameters";

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

