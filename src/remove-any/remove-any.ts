import { SourceFile } from "ts-morph";
import { removeAnyInFunction } from "./remove-any-in-function-parameters";
import { sum } from "../utils/array.utils";

export function removeAny(sourceFile: SourceFile): number {
  if (sourceFile.getBaseName().endsWith("js")) {
    return 0;
  }
  const results = sourceFile.getFunctions().map((sourceFn) => {
    return removeAnyInFunction(sourceFn);
  });

  return sum(results);
}
