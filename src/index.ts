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

  const filesWithNoAny = new Set<string>();

  let numberOfChanges = 1;
  let loopCount = 1;
  while (numberOfChanges !== 0) {
    numberOfChanges = 0;
    if (verbosity > 0) {
      console.log(`${filesWithNoAny.size} files are ignored, as they contains no 'any'`);
    }
    filteredSourceFiles.forEach((sourceFile, idx) => {
      if (filesWithNoAny.has(sourceFile.getFilePath())) {
        return;
      }
      const changes = removeAny(sourceFile, { noReverts, verbosity });
      if (verbosity > 0) {
        console.log(
          `Loop ${loopCount}, ${idx + 1}/ ${allSourceFiles.length}: file ${sourceFile.getBaseName()} , ${
            changes.countChangesDone
          } change(s) done`
        );
      }

      numberOfChanges += changes.countChangesDone;
      if (changes.countOfAnys === 0) {
        filesWithNoAny.add(sourceFile.getFilePath());
      }
    });

    ++loopCount;
  }
  await tsMorphProject.save();
}

main(process.argv)
  .then((s) => console.log("success", s))
  .catch((e) => console.error("error", e));
