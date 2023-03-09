import { removeAny } from "./remove-any";
import { Project, SourceFile } from "ts-morph";

describe("remove-any", () => {
  it("should remove `any` in type declaration", () => {
    const sourceFile = createSourceFile(`
  interface MyType { fn: (aParam) => void }
  function usingFn(t:MyType, v: number) {
      t.fn(v)
  } `);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `interface MyType {
    fn: (aParam: number) => void;
}
function usingFn(t: MyType, v: number) {
    t.fn(v);
}
`
    );
  });
});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.ts", code);
}
