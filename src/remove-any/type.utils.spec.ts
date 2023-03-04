import { Project, SourceFile } from "ts-morph";
import { findTypesOfVariableUsage } from "./type.utils";

describe("findTypesOfVariableUsage", () => {
  it("should return the type of one assignment", () => {
    const sourceFile = createSourceFile(`
let myVariable;

function initMyVariable() {
    myVariable = 'a_literal_string';
}      
      `);

    const variableDeclaration = sourceFile.getVariableDeclarations()[0];
    expect(variableDeclaration.getName()).toBe("myVariable");

    const typesOfUsage = findTypesOfVariableUsage(variableDeclaration);

    expect(typesOfUsage.map((s) => s.getText())).toStrictEqual(['"a_literal_string"']);
  });

  it("should return the type of one usage as function argument", () => {
    const sourceFile = createSourceFile(`
let myVariable;

function useMyVariable(y: boolean, x: number) {}
useMyVariable(true, myVariable);
      
      `);

    const variableDeclaration = sourceFile.getVariableDeclarations()[0];
    expect(variableDeclaration.getName()).toBe("myVariable");

    const typesOfUsage = findTypesOfVariableUsage(variableDeclaration);

    expect(typesOfUsage.map((s) => s.getText())).toStrictEqual(["number"]);
  });

  it("should return the type of one usage as method argument", () => {
    const sourceFile = createSourceFile(`
let myVariable;
Number.parseInt(myVariable);
      `);

    const variableDeclaration = sourceFile.getVariableDeclarations()[0];
    expect(variableDeclaration.getName()).toBe("myVariable");

    const typesOfUsage = findTypesOfVariableUsage(variableDeclaration);

    expect(typesOfUsage.map((s) => s.getText())).toStrictEqual(["string"]);
  });

});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.ts", code);
}
