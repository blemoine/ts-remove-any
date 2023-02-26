import { parseArgs } from "node:util";
import { readdir } from "node:fs/promises";
import { Project } from "ts-morph";
import { removeAny } from "./remove-any/remove-any";

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

  const mainTsConfigPath = `${directory}/${tsconfigFile}`;

  const project = new Project();
  project.addSourceFilesFromTsConfig(mainTsConfigPath);
  const allSourceFiles = project.getSourceFiles();

  allSourceFiles.forEach((sourceFile, idx) => {
    console.log(`File ${idx + 1}/ ${allSourceFiles.length}`);
    removeAny(sourceFile);
  });
  await project.save();
}

const args = process.argv.slice(2);
main(args)
  .then((s) => console.log("success", s))
  .catch((e) => console.error("error", e));
