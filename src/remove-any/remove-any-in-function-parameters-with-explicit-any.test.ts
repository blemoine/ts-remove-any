import { Project, SourceFile } from "ts-morph";
import { removeAny } from "./remove-any";
import { JsxEmit } from "typescript";

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

  it("should rollback to how the type was declared beforehand if there is a problem", () => {
    const sourceFile = createSourceFile(`
type TsFixMe = any;    
function fnToIgnore(my_explicit_variable: TsFixMe): {value: boolean} {
  Number.parseInt(my_explicit_variable);
  return { value: my_explicit_variable };
}`);

    removeAny(sourceFile, { explicit: true });
    expect(sourceFile.print()).toStrictEqual(
      `type TsFixMe = any;
function fnToIgnore(my_explicit_variable: TsFixMe): {
    value: boolean;
} {
    Number.parseInt(my_explicit_variable);
    return { value: my_explicit_variable };
}
`
    );
  });
});

function createSourceFile(code: string): SourceFile {
  const project = new Project({
    compilerOptions: {
      jsx: JsxEmit.ReactJSX,
    },
  });
  return project.createSourceFile("/tmp/not_used.tsx", code);
}
