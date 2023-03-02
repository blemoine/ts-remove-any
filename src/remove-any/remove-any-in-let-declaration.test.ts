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

    it("should add a type in let declaration inside functions", () => {
        const sourceFile = createSourceFile(`
before(() => {        
    let x;
    it(() => { x = 'test' });
});
`);

        const numberOfChanges = removeAny(sourceFile);
        expect(numberOfChanges).toBe(1);
        expect(sourceFile.print()).toStrictEqual(
            `before(() => {
    let x: "test";
    it(() => { x = 'test'; });
});
`
        );
    });


    it("should not do a change if doesn't compile", () => {
    const sourceFile = createSourceFile(`
let x;
x = {};
x.test = 2;
`);

    const numberOfChanges = removeAny(sourceFile);

    expect(sourceFile.print()).toStrictEqual(
      `let x;
x = {};
x.test = 2;
`
    );
    expect(numberOfChanges).toBe(0);
  });
});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.ts", code);
}
