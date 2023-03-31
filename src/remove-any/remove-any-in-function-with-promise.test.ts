import { removeAny } from "./remove-any";
import { Project, SourceFile } from "ts-morph";
import { JsxEmit } from "typescript";

describe("remove-any", () => {
  it("should not type catch of promises with arrow function", () => {
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

  it("should not type catch of promises", () => {
    const sourceFile = createSourceFile(`
function doSomething(p: Promise<string>) {
    p.catch(function (e) { Number.parseInt(e) })
}
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `function doSomething(p: Promise<string>) {
    p.catch(function (e) { Number.parseInt(e); });
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
