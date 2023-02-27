import { parseArgs } from "node:util";
import { readdir } from "node:fs/promises";
import { Project } from "ts-morph";
import { removeAny } from "./remove-any/remove-any";
import { sum } from "./utils/array.utils";
import { ParseArgsConfig } from "util";

async function main(args: string[]) {
  const options: ParseArgsConfig["options"] = {
    directory: {
      type: "string",
      short: "d",
      default: ".",
    },
    file: {
      type: "string",
      short: "f",
    },
    noReverts: {
      type: "boolean",
      default: false,
    },
  } as const;

  const { values } = parseArgs({ args, options, strict: true });
  const { directory, file, noReverts } = values;
  if (!directory || typeof directory !== "string") {
    throw new Error(`Directory parameter is mandatory`);
  }
  if (typeof noReverts !== "boolean") {
    throw new Error(`Revertable must be boolean`);
  }

  const filesInDir = await readdir(directory);
  const tsconfigFile = "tsconfig.json";
  if (!filesInDir.includes(tsconfigFile)) {
    throw new Error(`The directory must contain a tsconfig.json file`);
  }

  const mainTsConfigPath = `${directory}/${tsconfigFile}`;

  const project = new Project();
  project.addSourceFilesFromTsConfig(mainTsConfigPath);
  const allSourceFiles = project.getSourceFiles();

  let numberOfChanges = 1;
  let loopCount = 1;
  while (numberOfChanges !== 0) {
    numberOfChanges = sum(
      allSourceFiles
        .filter((sourceFile) => !file || sourceFile.getBaseName() === file)
        .map((sourceFile, idx) => {
          const changes = removeAny(sourceFile, { noReverts });
          console.log(
            `Loop ${loopCount}, ${idx + 1}/ ${
              allSourceFiles.length
            }: file ${sourceFile.getBaseName()} , ${changes} change(s) done`
          );

          return changes;
        })
    );

    ++loopCount;
  }
  await project.save();
}

const args = process.argv.slice(2);
main(args)
  .then((s) => console.log("success", s))
  .catch((e) => console.error("error", e));
