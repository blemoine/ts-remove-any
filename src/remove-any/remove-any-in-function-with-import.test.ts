import { Project, SourceFile } from "ts-morph";
import { removeAny } from "./remove-any";

describe("remove-any", () => {
  it("should add an import if needed", () => {
    const project = new Project();

    project.createSourceFile(
      "/tmp/ref_interface.ts",
      `
export interface User {
    name: string; 
}
export function getName(u: User) {
    return u.name;
}`
    );

    const sourceFile = project.createSourceFile(
      "/tmp/main.ts",
      `
import { getName } from '/tmp/ref_interface';

function doSomething(u) {
    getName(u);
}
`
    );

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `import { getName } from '/tmp/ref_interface';
import type { User } from "/tmp/ref_interface";
function doSomething(u: User) {
    getName(u);
}
`
    );
  });
});
