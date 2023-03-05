import { Project, SourceFile } from "ts-morph";
import { removeAny } from "./remove-any";

describe("remove-any", () => {
  it("should find remove any in constructor based on call", () => {
    const sourceFile = createSourceFile(`
class A {
    constructor(private value){}
}

new A('test');
    `);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `class A {
    constructor(private value: "test") { }
}
new A('test');
`
    );
  });
});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.ts", code);
}
