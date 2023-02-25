/*
import { Project } from "ts-morph";
import { removeAny } from "./remove-any/remove-any";

const project = new Project();

const dir = __dirname + "/__tests__/!**!/!*{.d.ts,.ts}";
console.log("Directory", dir);
project.addSourceFilesAtPaths(dir);
project.resolveSourceFileDependencies();

project.getSourceFiles().forEach((sourceFile) => {
  removeAny(sourceFile);
  console.log("#### RESULT ####");
  console.log(sourceFile.print());
});
*/

import { parseArgs } from "node:util";
import { readdir } from "node:fs/promises";

async function main(args: string[]) {
  const options = {
    directory: {
      type: "string",
      short: "d",
      default: ".",
    },
  } as const;

  const { values } = parseArgs({ args, options, strict: true });
  const { directory } = values;

  if (!directory) {
    throw new Error(`Directory parameter is mandatory`);
  }

  const files = await readdir(directory);
  const tsconfigFile = "tsconfig.json";
  if (!files.includes(tsconfigFile)) {
    throw new Error(`The directory must contain a tsconfig.json file`);
  }
  
  return `${directory}/${tsconfigFile}`;
}

const args = process.argv.slice(2);
main(args)
  .then((s) => console.log("success", s))
  .catch((e) => console.error("error", e));
