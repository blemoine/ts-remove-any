import { Project } from "ts-morph";
import { removeAny } from "./remove-any";

describe("remove-any", () => {
  it("should add an import if needed for a string enum", () => {
    const project = new Project();

    project.createSourceFile(
      "/tmp/ref_interface.ts",
      `
export enum User {
  Both = "both",
  Origin = "origin",
  Destination = "destination"
}
export function getName(u: User.Both) {
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
      `import { getName, User } from '/tmp/ref_interface';
function doSomething(u: User.Both) {
    getName(u);
}
`
    );
  });

  it("should add an import if needed for a number enum", () => {
    const project = new Project();

    project.createSourceFile(
      "/tmp/ref_interface.ts",
      `
export enum User {
  Both = 2,
  Origin = 4,
  Destination = 8
}
export function getName(u: User.Both) {
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
      `import { getName, User } from '/tmp/ref_interface';
function doSomething(u: User.Both) {
    getName(u);
}
`
    );
  });

  it("should add an import if needed for a standard enum", () => {
    const project = new Project();

    project.createSourceFile(
      "/tmp/ref_interface.ts",
      `
export enum User {
  Both,
  Origin,
  Destination 
}
export function getName(u: User.Both) {
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
      `import { getName, User } from '/tmp/ref_interface';
function doSomething(u: User.Both) {
    getName(u);
}
`
    );
  });
});
