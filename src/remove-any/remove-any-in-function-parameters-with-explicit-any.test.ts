import { Project, SourceFile } from "ts-morph";
import { removeAny } from "./remove-any";

describe("remove-any", () => {
  it("should replace explicit `any`s for function parameters", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable: any) {
  return { value: my_explicit_variable };
}

fnToIgnore(1234)`);

    removeAny(sourceFile, { explicit: true });
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: 1234) {
    return { value: my_explicit_variable };
}
fnToIgnore(1234);
`
    );
  });
});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.tsx", code);
}
