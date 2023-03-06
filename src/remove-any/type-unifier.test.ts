import { Project, SourceFile } from "ts-morph";
import { allTypesOfRefs } from "./type-unifier";

describe("allTypesOfRefs", () => {
  it("should return both side of assignment", () => {
    const sourceFile = createSourceFile(`
let myVariable;
myVariable = 'a_literal_string';      
      `);

    const variableDeclaration = sourceFile.getVariableDeclarations()[0];
    expect(variableDeclaration.getName()).toBe("myVariable");

    const typesOfUsage = allTypesOfRefs(variableDeclaration);

    expect(typesOfUsage.map((s) => s.getText())).toStrictEqual(["any", '"a_literal_string"']);
  });

  it("should return argument and parameter types of plain function", () => {
    const sourceFile = createSourceFile(`
let myVariable;
function test(_a: number, _b: string) { }
test(1, myVariable);
      `);

    const variableDeclaration = sourceFile.getVariableDeclarations()[0];
    expect(variableDeclaration.getName()).toBe("myVariable");

    const typesOfUsage = allTypesOfRefs(variableDeclaration);

    expect(typesOfUsage.map((s) => s.getText())).toStrictEqual(["any", "string"]);
  });

  it("should return argument and parameter types of arrow function", () => {
    const sourceFile = createSourceFile(`
let myVariable;
const test = (_a: number, _b: string, _c: boolean) => { }
test(1, '', myVariable);
      `);

    const variableDeclaration = sourceFile.getVariableDeclarations()[0];
    expect(variableDeclaration.getName()).toBe("myVariable");

    const typesOfUsage = allTypesOfRefs(variableDeclaration);

    expect(typesOfUsage.map((s) => s.getText())).toStrictEqual(["any", "boolean"]);
  });

  it("should return argument and parameter types of method call", () => {
    const sourceFile = createSourceFile(`
let myVariable;
class Test { myMethod(_a: number, _b: string, _c: string[]){} }
const test = new Test();
test.myMethod(1, '', myVariable);
      `);

    const variableDeclaration = sourceFile.getVariableDeclarations()[0];
    expect(variableDeclaration.getName()).toBe("myVariable");

    const typesOfUsage = allTypesOfRefs(variableDeclaration);

    expect(typesOfUsage.map((s) => s.getText())).toStrictEqual(["any", "string[]"]);
  });

  it("should return argument and parameter types of constructor", () => {
    const sourceFile = createSourceFile(`
let myVariable;
class Test { constructor(_a: number, _b: string, _c: boolean){} }
const test = new Test(1, '', myVariable);
      `);

    const variableDeclaration = sourceFile.getVariableDeclarations()[0];
    expect(variableDeclaration.getName()).toBe("myVariable");

    const typesOfUsage = allTypesOfRefs(variableDeclaration);

    expect(typesOfUsage.map((s) => s.getText())).toStrictEqual(["any", "boolean"]);
  });
});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.ts", code);
}
