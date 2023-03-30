import { ArrowFunction, Project, SourceFile } from "ts-morph";
import { allTypesOfRefs } from "./type-unifier";
import { getText } from "./type-model/type-model";

describe("allTypesOfRefs", () => {
  it("should return both side of assignment", () => {
    const sourceFile = createSourceFile(`
let myVariable;
myVariable = 'a_literal_string';      
      `);

    const variableDeclaration = sourceFile.getVariableDeclarations()[0];
    expect(variableDeclaration.getName()).toBe("myVariable");

    const typesOfUsage = allTypesOfRefs(variableDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(["any", '"a_literal_string"']);
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

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(expect.arrayContaining(["string"]));
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

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(expect.arrayContaining(["boolean"]));
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

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(expect.arrayContaining(["string[]"]));
  });

  it("should return the type of return if used in a return position", () => {
    const sourceFile = createSourceFile(`
    let myVariable;
function test(): string { return myVariable; }
      `);

    const variableDeclaration = sourceFile.getVariableDeclarations()[0];
    expect(variableDeclaration.getName()).toBe("myVariable");

    const typesOfUsage = allTypesOfRefs(variableDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(["any", "string"]);
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

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(expect.arrayContaining(["boolean"]));
  });

  it("should return the type of variable assignment", () => {
    const sourceFile = createSourceFile(`
let myVariable;
const myVariable2: Array<boolean> = myVariable;      
      `);

    const variableDeclaration = sourceFile.getVariableDeclarations()[0];
    expect(variableDeclaration.getName()).toBe("myVariable");

    const typesOfUsage = allTypesOfRefs(variableDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(["any", "boolean[]"]);
  });

  it("should return the type of variable assignment in array", () => {
    const sourceFile = createSourceFile(`
let myVariable;
const myVariable2: Array<boolean> = [myVariable];      
      `);

    const variableDeclaration = sourceFile.getVariableDeclarations()[0];
    expect(variableDeclaration.getName()).toBe("myVariable");

    const typesOfUsage = allTypesOfRefs(variableDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(["any", "boolean"]);
  });

  it("should return the type of variable assignment in object", () => {
    const sourceFile = createSourceFile(`
let myVariable;
const myVariable2: {x: number, y: string} = {x: myVariable, y: ''};      
      `);

    const variableDeclaration = sourceFile.getVariableDeclarations()[0];
    expect(variableDeclaration.getName()).toBe("myVariable");

    const typesOfUsage = allTypesOfRefs(variableDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(["any", "number"]);
  });

  it("should return the type of variable assignment in nested object", () => {
    const sourceFile = createSourceFile(`
let myVariable;
const myVariable2: {z:{x: number, y: string}} = {z:{x: myVariable, y: ''}};      
      `);

    const variableDeclaration = sourceFile.getVariableDeclarations()[0];
    expect(variableDeclaration.getName()).toBe("myVariable");

    const typesOfUsage = allTypesOfRefs(variableDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(["any", "number"]);
  });

  it("should return the type of arguments of function", () => {
    const sourceFile = createSourceFile(`
function (x) {
  return Number.parseInt(x);
}      
      `);

    const paramaterDeclaration = sourceFile.getFunctions()[0].getParameters()[0];
    expect(paramaterDeclaration.getName()).toBe("x");

    const typesOfUsage = allTypesOfRefs(paramaterDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(["any", "string"]);
  });

  it("should return the type of arguments of arrow function", () => {
    const sourceFile = createSourceFile(`
const arr = (x) => Number.parseInt(x)    
      `);

    const paramaterDeclaration = (
      sourceFile.getVariableDeclaration("arr")?.getInitializer() as ArrowFunction
    ).getParameters()[0];
    expect(paramaterDeclaration.getName()).toBe("x");

    const typesOfUsage = allTypesOfRefs(paramaterDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(["any", "string"]);
  });

  it("should return the type of arguments of function when called", () => {
    const sourceFile = createSourceFile(`
function test(x) {}
test('value');
      `);

    const paramaterDeclaration = sourceFile.getFunctions()[0].getParameters()[0];
    expect(paramaterDeclaration.getName()).toBe("x");

    const typesOfUsage = allTypesOfRefs(paramaterDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(["any", '"value"']);
  });

  it("should return the type of arguments of arrow function when called", () => {
    const sourceFile = createSourceFile(`
const test = (x) => {}
test('value');
      `);

    const paramaterDeclaration = (
      sourceFile.getVariableDeclaration("test")?.getInitializer() as ArrowFunction
    ).getParameters()[0];
    expect(paramaterDeclaration.getName()).toBe("x");

    const typesOfUsage = allTypesOfRefs(paramaterDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(["any", '"value"']);
  });

  it("should return the type of arguments of JSX when called", () => {
    const sourceFile = createSourceFile(`
const Test = ({bus}:{bus:string}) => <div>{bus}</div>
function (bus) {return <Test bus={bus} /> }    
      `);

    const paramaterDeclaration = sourceFile.getFunctions()[0].getParameters()[0];
    expect(paramaterDeclaration.getName()).toBe("bus");

    const typesOfUsage = allTypesOfRefs(paramaterDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(["any", "string"]);
  });

  it("should return the type of arguments of class constructor when called", () => {
    const sourceFile = createSourceFile(`
class A {
   constructor(x) {} 
}    
new A('value');
      `);

    const paramaterDeclaration = sourceFile.getClasses()[0].getConstructors()[0].getParameters()[0];
    expect(paramaterDeclaration?.getName()).toBe("x");

    const typesOfUsage = allTypesOfRefs(paramaterDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(["any", '"value"']);
  });

  it("should return the type of arguments of methods when called", () => {
    const sourceFile = createSourceFile(`
class A {
   myMethod(x) {} 
}    
const a = new A();
a.myMethod('value');
      `);

    const paramaterDeclaration = sourceFile.getClasses()[0].getMethods()[0].getParameters()[0];
    expect(paramaterDeclaration?.getName()).toBe("x");

    const typesOfUsage = allTypesOfRefs(paramaterDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(["any", '"value"']);
  });

  it("should return all the type of arguments of function when called", () => {
    const sourceFile = createSourceFile(`
function test(x) {}
test('value');
test('value2');
test('value3');
      `);

    const paramaterDeclaration = sourceFile.getFunctions()[0].getParameters()[0];
    expect(paramaterDeclaration.getName()).toBe("x");

    const typesOfUsage = allTypesOfRefs(paramaterDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(["any", '"value"', '"value2"', '"value3"']);
  });

  it("should set the type even in a beta reduction case", () => {
    const sourceFile = createSourceFile(`
function test(x) {
  return { value: x };
}
function map(x: (n:number) => {value: number}) {}
map(test);
`);

    const paramaterDeclaration = sourceFile.getFunctions()[0].getParameters()[0];
    expect(paramaterDeclaration.getName()).toBe("x");

    const typesOfUsage = allTypesOfRefs(paramaterDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(["any", "number"]);
  });

  it("should set the type even in a beta reduction case with dotted property and the callback is the 2nd parameter", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(x) {
  return { value: x };
}
class Test {
    highLevelMethod(arr: string[], fn: (n: string) => unknown) {
    }
}

const test = new Test();
test.highLevelMethod([], fnToIgnore);
`);

    const paramaterDeclaration = sourceFile.getFunctions()[0].getParameters()[0];
    expect(paramaterDeclaration.getName()).toBe("x");

    const typesOfUsage = allTypesOfRefs(paramaterDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(["any", "string"]);
  });

  it("should find the types of an empty array used in a function", () => {
    const sourceFile = createSourceFile(`
function fn(arr: number[]){}      
const x = [];
fn(x);      
`);

    const paramaterDeclaration = sourceFile.getVariableDeclarations()[0];
    expect(paramaterDeclaration.getName()).toBe("x");

    const typesOfUsage = allTypesOfRefs(paramaterDeclaration);

    expect(typesOfUsage.types.map((s) => getText(s))).toStrictEqual(expect.arrayContaining(["number[]"]));
  });
});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.tsx", code);
}
