import { Project, SourceFile } from "ts-morph";
import { removeAny } from "./remove-any";

describe("remove-any", () => {
  it("should keep explicit `any`s for function parameters", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable: any) {
  return { value: my_explicit_variable };
}

fnToIgnore(1234)`);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: any) {
    return { value: my_explicit_variable };
}
fnToIgnore(1234);
`
    );
  });

  it("should add explicit type for a any in function parameters", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
  return { value: my_explicit_variable };
}

fnToIgnore(1234)`);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: 1234) {
    return { value: my_explicit_variable };
}
fnToIgnore(1234);
`
    );
  });

  it("should set the type to union type if called with 4 numbers", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
  return { value: my_explicit_variable };
}

fnToIgnore(1)
fnToIgnore(4)
fnToIgnore(3)
fnToIgnore(2)`);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: 1 | 4 | 3 | 2) {
    return { value: my_explicit_variable };
}
fnToIgnore(1);
fnToIgnore(4);
fnToIgnore(3);
fnToIgnore(2);
`
    );
  });

  it("should set the type to number if called with more than 4 numbers", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
  return { value: my_explicit_variable };
}

fnToIgnore(1)
fnToIgnore(4)
fnToIgnore(3)
fnToIgnore(2)
fnToIgnore(5)`);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: number) {
    return { value: my_explicit_variable };
}
fnToIgnore(1);
fnToIgnore(4);
fnToIgnore(3);
fnToIgnore(2);
fnToIgnore(5);
`
    );
  });

  it("should set the type to boolean if called with boolean", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
  return { value: my_explicit_variable };
}

fnToIgnore(true)
`);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: boolean) {
    return { value: my_explicit_variable };
}
fnToIgnore(true);
`
    );
  });

  it("should set the type to the transitively found type", () => {
    const sourceFile = createSourceFile(`
interface User { }        
function fnToIgnore(my_explicit_variable) {
  return { value: my_explicit_variable };
}

function callsite(n: User) {
   fnToIgnore(n);
}
`);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `interface User {
}
function fnToIgnore(my_explicit_variable: User) {
    return { value: my_explicit_variable };
}
function callsite(n: User) {
    fnToIgnore(n);
}
`
    );
  });

  it("should set the type to string if more than 5 calls", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
  return { value: my_explicit_variable };
}

fnToIgnore('1');
fnToIgnore('4');
fnToIgnore('3');
fnToIgnore('2');
fnToIgnore('5');
`);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: string) {
    return { value: my_explicit_variable };
}
fnToIgnore('1');
fnToIgnore('4');
fnToIgnore('3');
fnToIgnore('2');
fnToIgnore('5');
`
    );
  });

  it("should deduplicate the types added", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
  return { value: my_explicit_variable };
}

fnToIgnore('1');
fnToIgnore('1');
fnToIgnore('1');
`);

    const numberOfChanges = removeAny(sourceFile);
    expect(numberOfChanges).toBe(1);
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: "1") {
    return { value: my_explicit_variable };
}
fnToIgnore('1');
fnToIgnore('1');
fnToIgnore('1');
`
    );
  });

  it("should not set any", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
  return { value: my_explicit_variable };
}

function callsite(n: any) {
   fnToIgnore(n);
}
`);

    const numberOfChanges = removeAny(sourceFile);
    expect(numberOfChanges).toBe(0);
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable) {
    return { value: my_explicit_variable };
}
function callsite(n: any) {
    fnToIgnore(n);
}
`
    );
  });

    it("should use the usage type if possible", () => {
        const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
  const a: number = my_explicit_variable;
  return a;
}

function callsite(n: any) {
   fnToIgnore(n);
}
`);

        const numberOfChanges = removeAny(sourceFile);
        expect(numberOfChanges).toBe(1);
        expect(sourceFile.print()).toStrictEqual(
            `function fnToIgnore(my_explicit_variable: number) {
    const a: number = my_explicit_variable;
    return a;
}
function callsite(n: any) {
    fnToIgnore(n);
}
`
        );
    });

    it("should use the usage type in function call  if possible", () => {
        const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
  wellDefinedFn(my_explicit_variable);
}

function wellDefinedFn(x: string) { }

function callsite(n: any) {
   fnToIgnore(n);
}
`);

        const numberOfChanges = removeAny(sourceFile);
        expect(numberOfChanges).toBe(1);
        expect(sourceFile.print()).toStrictEqual(
            `function fnToIgnore(my_explicit_variable: string) {
    wellDefinedFn(my_explicit_variable);
}
function wellDefinedFn(x: string) { }
function callsite(n: any) {
    fnToIgnore(n);
}
`
        );
    })

    it("should use the usage type in method call if possible", () => {
        const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
  const test = new Test();
  test.wellDefinedFn(1, my_explicit_variable);
}

class Test {
    wellDefinedFn(t: number, x: string) { }
}

function callsite(n: any) {
   fnToIgnore(n);
}
`);

        const numberOfChanges = removeAny(sourceFile);
        expect(numberOfChanges).toBe(1);
        expect(sourceFile.print()).toStrictEqual(
            `function fnToIgnore(my_explicit_variable: string) {
    const test = new Test();
    test.wellDefinedFn(1, my_explicit_variable);
}
class Test {
    wellDefinedFn(t: number, x: string) { }
}
function callsite(n: any) {
    fnToIgnore(n);
}
`
        );
    })


    it("should not merge string and literal string", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
  return { value: my_explicit_variable };
}

function callsite(n: string) {
   fnToIgnore(n);
}
function callsite2(n: 'test') {
   fnToIgnore(n);
}
`);

    const numberOfChanges = removeAny(sourceFile);
    expect(numberOfChanges).toBe(1);
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: string) {
    return { value: my_explicit_variable };
}
function callsite(n: string) {
    fnToIgnore(n);
}
function callsite2(n: 'test') {
    fnToIgnore(n);
}
`
    );
  });

  it("should set the type even in a beta reduction case", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
  return { value: my_explicit_variable };
}
function map(x: number) {}

const arr: number[] = [];
map(fnToIgnore);
`);

    const numberOfChanges = removeAny(sourceFile);

    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: number) {
    return { value: my_explicit_variable };
}
function map(x: number) { }
const arr: number[] = [];
map(fnToIgnore);
`
    );
    expect(numberOfChanges).toBe(1);
  });

    it("should set the type even in a beta reduction case with dotted property", () => {
        const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
  return { value: my_explicit_variable };
}

const arr: number[] = [];
arr.map(fnToIgnore);
`);

        const numberOfChanges = removeAny(sourceFile);

        expect(sourceFile.print()).toStrictEqual(
            `function fnToIgnore(my_explicit_variable: number) {
    return { value: my_explicit_variable };
}
const arr: number[] = [];
arr.map(fnToIgnore);
`
        );
        expect(numberOfChanges).toBe(1);
    })

    it("should set the type even in a beta reduction case with dotted property and the callback is the 2nd parameter", () => {
        const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
  return { value: my_explicit_variable };
}
class Test {
    highLevelMethod(arr: string[], fn: (n:number) => unknown) {
    }
}

const test = new Test();
test.highLevelMethod([], fnToIgnore);
`);

        const numberOfChanges = removeAny(sourceFile);

        expect(sourceFile.print()).toStrictEqual(
            `function fnToIgnore(my_explicit_variable: number) {
    return { value: my_explicit_variable };
}
class Test {
    highLevelMethod(arr: string[], fn: (n: number) => unknown) {
    }
}
const test = new Test();
test.highLevelMethod([], fnToIgnore);
`
        );
        expect(numberOfChanges).toBe(1);
    })
});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.ts", code);
}
