import { Project } from "ts-morph";
import { removeAny } from "./remove-any/remove-any";
import { sum } from "./utils/array.utils";
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

  let numberOfChanges = 1;
  let loopCount = 1;
  while (numberOfChanges !== 0) {
    numberOfChanges = sum(
      filteredSourceFiles.map((sourceFile, idx) => {
        const changes = removeAny(sourceFile, { noReverts, verbosity });
        if (verbosity > 0) {
          console.log(
            `Loop ${loopCount}, ${idx + 1}/ ${
              allSourceFiles.length
            }: file ${sourceFile.getBaseName()} , ${changes} change(s) done`
          );
        }

        return changes.countChangesDone;
      })
    );

    ++loopCount;
  }
  await tsMorphProject.save();
}

main(process.argv)
  .then((s) => console.log("success", s))
  .catch((e) => console.error("error", e));
