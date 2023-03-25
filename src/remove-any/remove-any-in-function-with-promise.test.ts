import { removeAny } from "./remove-any";
import { Project, SourceFile } from "ts-morph";

describe("remove-any", () => {
  it("should not type catch of promises", () => {
    const sourceFile = createSourceFile(`
function doSomething(p: Promise<string>) {
    p.catch(e => Number.parseInt(e))
}
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `function doSomething(p: Promise<string>) {
    p.catch(e => Number.parseInt(e));
}
`
    );
  });
});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.tsx", code);
}