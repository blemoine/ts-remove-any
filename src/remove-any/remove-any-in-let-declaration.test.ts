import { Project, SourceFile } from "ts-morph";
import { removeAny } from "./remove-any";

describe("remove in let declaration", () => {
  it("should add a type in let declaration", () => {
    const sourceFile = createSourceFile(`
let x;
x = 1;
`);

    const numberOfChanges = removeAny(sourceFile);
    expect(numberOfChanges).toBe(1);
    expect(sourceFile.print()).toStrictEqual(
      `let x: 1;
x = 1;
`
    );
  });
});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.ts", code);
}
