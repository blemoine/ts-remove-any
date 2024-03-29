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
      `import { getName, User } from '/tmp/ref_interface';
function doSomething(u: User) {
    getName(u);
}
`
    );
  });

  it("should not add multiple times same import", () => {
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
function doSomethingElse(v) {
    getName(v);
}
`
    );

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `import { getName, User } from '/tmp/ref_interface';
function doSomething(u: User) {
    getName(u);
}
function doSomethingElse(v: User) {
    getName(v);
}
`
    );
  });

  it("should not add multiple times same default import", () => {
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
function doSomethingElse(v) {
    getName(v);
}
function doSomethingElseAgain(v) {
    getName(v);
}
`
    );

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `import User, { getName } from '/tmp/ref_interface';
function doSomething(u: User) {
    getName(u);
}
function doSomethingElse(v: User) {
    getName(v);
}
function doSomethingElseAgain(v: User) {
    getName(v);
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
      `import User, { getName } from '/tmp/ref_interface';
function doSomething(u: User) {
    getName(u);
}
`
    );
  });

  it("should reuse a default import", () => {
    const project = new Project();

    project.createSourceFile(
      "/tmp/ref_interface.ts",
      `
export default interface User {
    name: string; 
}`
    );

    const sourceFile = project.createSourceFile(
      "/tmp/main.ts",
      `
import Something from '/tmp/ref_interface';

let a: Something = { name: 'something' };

function doSomething(b) { }
doSomething(a);
`
    );

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `import Something from '/tmp/ref_interface';
let a: Something = { name: 'something' };
function doSomething(b: Something) { }
doSomething(a);
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
      `import User, { getName } from '/tmp/ref_interface';
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
      `import User, { getName } from '/tmp/ref_interface';
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

    removeAny(sourceFile);
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

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `import { getName } from '/tmp/ref_interface';
function doSomething(u) {
    getName(u);
    u.age = 12;
}
`
    );
  });
});
