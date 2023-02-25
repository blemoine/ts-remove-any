import { Project } from "ts-morph";
import { removeAny } from "./remove-any/remove-any";

const project = new Project();

const dir = __dirname + "/__tests__/**/*{.d.ts,.ts}";
console.log("Directory", dir);
project.addSourceFilesAtPaths(dir);
project.resolveSourceFileDependencies();

project.getSourceFiles().forEach((sourceFile) => {
  removeAny(sourceFile);
  console.log("#### RESULT ####");
  console.log(sourceFile.print());
});
