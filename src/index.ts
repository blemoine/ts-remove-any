import { Project } from "ts-morph";
import { removeAny } from "./remove-any/remove-any";
import { parseCliArgs } from "./cli-parser";

async function main(args: string[]) {
  const { project, file, noReverts, verbosity } = parseCliArgs(args);

  const tsMorphProject = new Project({
    tsConfigFilePath: project,
  });

  const allSourceFiles = tsMorphProject.getSourceFiles();
  const filteredSourceFiles = allSourceFiles.filter((sourceFile) => {
    if (!file) {
      return true;
    }

    return sourceFile.getFilePath().includes(file);
  });

  let numberOfChanges = 0;
  filteredSourceFiles.forEach((sourceFile, idx) => {
    const changes = removeAny(sourceFile, { noReverts, verbosity });
    if (verbosity > 0) {
      console.info(
        `${idx + 1}/ ${allSourceFiles.length}: file ${sourceFile.getFilePath()} , ${
          changes.countChangesDone
        } change(s) done`
      );
    }

    numberOfChanges += changes.countChangesDone;
  });

  await tsMorphProject.save();

  return numberOfChanges;
}

main(process.argv)
  .then((s) => console.info("Succeeded with ", s, " change(s)"))
  .catch((e) => console.error("error", e));
