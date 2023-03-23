import { removeAny } from "./remove-any";
import { Project, SourceFile } from "ts-morph";

describe("remove-any", () => {
  it("should type with aliased union", () => {
    const sourceFile = createSourceFile(`
type StringOrNumber = string | number;
function fnToIgnore(my_explicit_variable) {
}
function fn2(x: StringOrNumber) {
    fnToIgnore(x);
}
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `type StringOrNumber = string | number;
function fnToIgnore(my_explicit_variable: StringOrNumber) {
}
function fn2(x: StringOrNumber) {
    fnToIgnore(x);
}
`
    );
  });

  it("should deduplicate union types", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
  if (typeof my_explicit_variable !== 'boolean') {
      innerFn(my_explicit_variable);
  }    
  if (typeof my_explicit_variable !== 'number') {
      innerFn2(my_explicit_variable);
  }
}

function innerFn(x: string | number) {}
function innerFn2(x: string | boolean) {}
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: string | number | boolean) {
    if (typeof my_explicit_variable !== 'boolean') {
        innerFn(my_explicit_variable);
    }
    if (typeof my_explicit_variable !== 'number') {
        innerFn2(my_explicit_variable);
    }
}
function innerFn(x: string | number) { }
function innerFn2(x: string | boolean) { }
`
    );
  });

  it("should type with  intersection", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
}
function fn2(x: {name: string} & {age: number}) {
    fnToIgnore(x);
}
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: {
    "name": string;
    "age": number;
}) {
}
function fn2(x: {
    name: string;
} & {
    age: number;
}) {
    fnToIgnore(x);
}
`
    );
  });

  it("should type with aliased intersection", () => {
    const sourceFile = createSourceFile(`
type User = {name: string} & {age: number};
function fnToIgnore(my_explicit_variable) {
}
function fn2(x: User) {
    fnToIgnore(x);
}
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `type User = {
    name: string;
} & {
    age: number;
};
function fnToIgnore(my_explicit_variable: User) {
}
function fn2(x: User) {
    fnToIgnore(x);
}
`
    );
  });
});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.tsx", code);
}