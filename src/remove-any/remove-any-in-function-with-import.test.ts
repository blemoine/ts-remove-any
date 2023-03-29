import { Project } from "ts-morph";
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

  it("should add an import with default interface if needed", () => {
    const project = new Project();

    project.createSourceFile(
      "/tmp/ref_interface.ts",
      `
export default interface User {
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
import type User from "/tmp/ref_interface";
function doSomething(u: User) {
    getName(u);
}
`
    );
  });

  it("should add an import with default type if needed", () => {
    const project = new Project();

    project.createSourceFile(
      "/tmp/ref_interface.ts",
      `
type User = {
    name: string; 
};
export default User;
export function getName(u: User): string {
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
import type User from "/tmp/ref_interface";
function doSomething(u: User) {
    getName(u);
}
`
    );
  });

  it("should add an import with default class if needed", () => {
    const project = new Project();

    project.createSourceFile(
      "/tmp/ref_interface.ts",
      `
export default class User {
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
import type User from "/tmp/ref_interface";
function doSomething(u: User) {
    getName(u);
}
`
    );
  });

  it("should revert an import if it breaks the code", () => {
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
    u.age = 12;
}
`
    );

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `import { getName } from '/tmp/ref_interface';
function doSomething(u) {
    getName(u);
    u.age = 12;
}
`
    );
  });

    it("should revert a default import if it breaks the code", () => {
        const project = new Project();

        project.createSourceFile(
            "/tmp/ref_interface.ts",
            `
export default interface User {
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
    u.age = 12;
}
`
        );

        removeAny(sourceFile, { verbosity: 2 });
        expect(sourceFile.print()).toStrictEqual(
            `import { getName } from '/tmp/ref_interface';
function doSomething(u) {
    getName(u);
    u.age = 12;
}
`
        );
    })
});
