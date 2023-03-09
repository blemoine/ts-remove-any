import { Project, SourceFile } from "ts-morph";
import { getCallablesTypes } from "./callables.unifier";

describe("getCallablesTypes", () => {
  it("should return arguments and parameters types of plain function", () => {
    const sourceFile = createSourceFile(`
let myVariable;
function test(_a: number, _b: string) { }
test(1, myVariable);
test(3, 'test');
      `);

    const functionDeclaration = sourceFile.getFunctions()[0];
    expect(functionDeclaration.getName()).toBe("test");

    const typesOfFunction = getCallablesTypes(functionDeclaration);

    expect(typesOfFunction.argumentsTypes.map((s) => s.map((p) => p.getText()))).toStrictEqual([
      ["1", "any"],
      ["3", '"test"'],
    ]);
    expect(typesOfFunction.parameterTypes.map((p) => p.getText())).toStrictEqual(["number", "string"]);
  });

  it("should return arguments and parameters types of plain function if there's any in the parameters", () => {
    const sourceFile = createSourceFile(`
let myVariable = 'value';
function test(_a, _b) { }
test(1, myVariable);
test(2, 'test');
      `);

    const functionDeclaration = sourceFile.getFunctions()[0];
    expect(functionDeclaration.getName()).toBe("test");

    const typesOfFunction = getCallablesTypes(functionDeclaration);

    expect(typesOfFunction.argumentsTypes.map((s) => s.map((p) => p.getText()))).toStrictEqual([
      ["1", "string"],
      ["2", '"test"'],
    ]);
    expect(typesOfFunction.parameterTypes.map((p) => p.getText())).toStrictEqual(["any", "any"]);
  });

  it("should return arguments and parameters types of plain function used as references", () => {
    const sourceFile = createSourceFile(`
function test(c, x) {
  return { value: x };
}
function map(a: string, x: (c:string, n:number) => {value: number}) {}
map('v', test);
test('a', 123)
      `);

    const functionDeclaration = sourceFile.getFunctions()[0];
    expect(functionDeclaration.getName()).toBe("test");

    const typesOfFunction = getCallablesTypes(functionDeclaration);

    expect(typesOfFunction.argumentsTypes.map((s) => s.map((p) => p.getText()))).toStrictEqual([
      ["string", "number"],
      ['"a"', "123"],
    ]);
    expect(typesOfFunction.parameterTypes.map((p) => p.getText())).toStrictEqual(["any", "any"]);
  });

  it("should return arguments and parameters types of plain function used as references in dotted parameters", () => {
    const sourceFile = createSourceFile(`
function test(c, x) {
  return { value: x };
}
const arr: string[] = [];
arr.map(test);
test('a', 123)
      `);

    const functionDeclaration = sourceFile.getFunctions()[0];
    expect(functionDeclaration.getName()).toBe("test");

    const typesOfFunction = getCallablesTypes(functionDeclaration);

    expect(typesOfFunction.argumentsTypes.map((s) => s.map((p) => p.getText()))).toStrictEqual([
      ["string", "number"],
      ['"a"', "123"],
    ]);
    expect(typesOfFunction.parameterTypes.map((p) => p.getText())).toStrictEqual(["any", "any"]);
  })
});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.tsx", code);
}
