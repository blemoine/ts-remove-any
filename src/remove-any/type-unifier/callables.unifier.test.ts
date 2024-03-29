import { ArrowFunction, ConstructorDeclaration, MethodDeclaration, Project, SourceFile, Node } from "ts-morph";
import { getCallablesTypes } from "./callables.unifier";
import { getSerializedTypeModel, TypeModel } from "../type-model/type-model";

function getText(t: TypeModel): string {
  return getSerializedTypeModel(t).name;
}

describe("getCallablesTypes", () => {
  describe("for plain functions", () => {
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

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["1", "any"],
        ["3", '"test"'],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["number", "string"]);
      expect(typesOfFunction.usageInFunction()).toStrictEqual({});
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

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["1", "string"],
        ["2", '"test"'],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["any", "any"]);
      expect(typesOfFunction.usageInFunction()).toStrictEqual({});
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

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["string", "number"],
        ['"a"', "123"],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["any", "any"]);
      expect(
        Object.entries(typesOfFunction.usageInFunction()).map(([idx, types]) => [idx, getText(types)])
      ).toStrictEqual([]);
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

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["string", "number"],
        ['"a"', "123"],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["any", "any"]);
      expect(
        Object.entries(typesOfFunction.usageInFunction()).map(([idx, types]) => [idx, getText(types)])
      ).toStrictEqual([]);
    });

    it("should return arguments and parameters types of plain function used as references in multiple dotted parameters", () => {
      const sourceFile = createSourceFile(`
function test(c, x) {
  return { value: x };
}
const obj: {arr: boolean[]} = {arr:[]};
obj.arr.map(test);
test('a', 123)
      `);

      const functionDeclaration = sourceFile.getFunctions()[0];
      expect(functionDeclaration.getName()).toBe("test");

      const typesOfFunction = getCallablesTypes(functionDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["boolean", "number"],
        ['"a"', "123"],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["any", "any"]);
      expect(
        Object.entries(typesOfFunction.usageInFunction()).map(([idx, types]) => [idx, getText(types)])
      ).toStrictEqual([]);
    });

    it("should return a built type from usage in plain function", () => {
      const sourceFile = createSourceFile(`
function test(c, x) {
  return Number.parseInt(c.value) + Number.parseInt(c.name.length);
}
`);

      const functionDeclaration = sourceFile.getFunctions()[0];
      expect(functionDeclaration.getName()).toBe("test");

      const typesOfFunction = getCallablesTypes(functionDeclaration);

      expect(typesOfFunction.argumentsTypes()).toStrictEqual([]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["any", "any"]);
      expect(
        Object.entries(typesOfFunction.usageInFunction()).map(([idx, types]) => [idx, getText(types)])
      ).toStrictEqual([["0", '{"value": string; "name": {"length": string}}']]);
    });
  });

  describe("for arrow functions", () => {
    it("should return arguments and parameters types of arrow function", () => {
      const sourceFile = createSourceFile(`
let myVariable;
const test = (_a: number, _b: string) => { }
test(1, myVariable);
test(3, 'test');
      `);

      const functionDeclaration = sourceFile.getVariableDeclaration("test")?.getInitializer();
      if (!functionDeclaration || !(functionDeclaration instanceof ArrowFunction)) {
        throw new Error("test should be defined");
      }

      const typesOfFunction = getCallablesTypes(functionDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["1", "any"],
        ["3", '"test"'],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["number", "string"]);
      expect(typesOfFunction.usageInFunction()).toStrictEqual({});
    });

    it("should return arguments and parameters types of arrow function if there's any in the parameters", () => {
      const sourceFile = createSourceFile(`
let myVariable = 'value';
const test = (_a, _b) => { }
test(1, myVariable);
test(2, 'test');
      `);

      const functionDeclaration = sourceFile.getVariableDeclaration("test")?.getInitializer();
      if (!functionDeclaration || !(functionDeclaration instanceof ArrowFunction)) {
        throw new Error("test should be defined");
      }
      const typesOfFunction = getCallablesTypes(functionDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["1", "string"],
        ["2", '"test"'],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["any", "any"]);
      expect(typesOfFunction.usageInFunction()).toStrictEqual({});
    });

    it("should return arguments and parameters types of arrow function used as references", () => {
      const sourceFile = createSourceFile(`
const test = (c, x) => {
  return { value: x };
}
const map = (a: string, x: (c:string, n:number) => {value: number}) => {}
map('v', test);
test('a', 123)
      `);

      const functionDeclaration = sourceFile.getVariableDeclaration("test")?.getInitializer();
      if (!functionDeclaration || !(functionDeclaration instanceof ArrowFunction)) {
        throw new Error("test should be defined");
      }

      const typesOfFunction = getCallablesTypes(functionDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["string", "number"],
        ['"a"', "123"],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["any", "any"]);
      expect(
        Object.entries(typesOfFunction.usageInFunction()).map(([idx, types]) => [idx, getText(types)])
      ).toStrictEqual([]);
    });

    it("should return arguments and parameters types of arrow function used as references in dotted parameters", () => {
      const sourceFile = createSourceFile(`
const test = (c, x) => {
  return { value: x };
}
const arr: string[] = [];
arr.map(test);
test('a', 123)
      `);

      const functionDeclaration = sourceFile.getVariableDeclaration("test")?.getInitializer();
      if (!functionDeclaration || !(functionDeclaration instanceof ArrowFunction)) {
        throw new Error("test should be defined");
      }

      const typesOfFunction = getCallablesTypes(functionDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["string", "number"],
        ['"a"', "123"],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["any", "any"]);
      expect(
        Object.entries(typesOfFunction.usageInFunction()).map(([idx, types]) => [idx, getText(types)])
      ).toStrictEqual([]);
    });

    it("should return the arguments and parameters when the arrow function is used in JSX context with autoclose tag", () => {
      const sourceFile = createSourceFile(`
const handleError = (err) => {}
const ChildComponent = (props: {onError: (str:string) => void}) => <div></div>
const ParentComponent = () => {
    handleError(123);
    return <ChildComponent onError={handleError} />
}
      `);

      const functionDeclaration = sourceFile.getVariableDeclaration("handleError")?.getInitializer();
      if (!functionDeclaration || !(functionDeclaration instanceof ArrowFunction)) {
        throw new Error("test should be defined");
      }

      const typesOfFunction = getCallablesTypes(functionDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["123"],
        ["string"],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["any"]);
      expect(typesOfFunction.usageInFunction()).toStrictEqual({});
    });

    it("should return the arguments and parameters when the arrow function is used in JSX context with open tag", () => {
      const sourceFile = createSourceFile(`
const handleError = (err) => {}
const ChildComponent = (props: {onError: (str:string) => void}) => <div></div>
const ParentComponent = () => {
    handleError(123);
    return <ChildComponent onError={handleError} ></ChildComponent>
}
      `);

      const functionDeclaration = sourceFile.getVariableDeclaration("handleError")?.getInitializer();
      if (!functionDeclaration || !(functionDeclaration instanceof ArrowFunction)) {
        throw new Error("test should be defined");
      }

      const typesOfFunction = getCallablesTypes(functionDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["123"],
        ["string"],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["any"]);
      expect(typesOfFunction.usageInFunction()).toStrictEqual({});
    });
  });

  describe("for methods", () => {
    it("should return arguments and parameters types of method", () => {
      const sourceFile = createSourceFile(`
let myVariable;
class Test { method(_a: number, _b: string) { } }
const test = new Test()
test.method(1, myVariable);
test.method(3, 'test');
      `);

      const functionDeclaration = sourceFile.getClass("Test")?.getMethod("method");
      if (!functionDeclaration || !(functionDeclaration instanceof MethodDeclaration)) {
        throw new Error("test should be defined");
      }

      const typesOfFunction = getCallablesTypes(functionDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["1", "any"],
        ["3", '"test"'],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["number", "string"]);
      expect(typesOfFunction.usageInFunction()).toStrictEqual({});
    });

    it("should return arguments and parameters types of method if there's any in the parameters", () => {
      const sourceFile = createSourceFile(`
let myVariable = 'value';
class Test { method(_a, _b) { } }
const test = new Test()
test.method(1, myVariable);
test.method(2, 'test');
      `);

      const functionDeclaration = sourceFile.getClass("Test")?.getMethod("method");
      if (!functionDeclaration || !(functionDeclaration instanceof MethodDeclaration)) {
        throw new Error("test should be defined");
      }
      const typesOfFunction = getCallablesTypes(functionDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["1", "string"],
        ["2", '"test"'],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["any", "any"]);
      expect(typesOfFunction.usageInFunction()).toStrictEqual({});
    });

    it("should return arguments and parameters types of method used as references", () => {
      const sourceFile = createSourceFile(`
class Test { method(c, x) {
  return { value: x };
}
}
const test = new Test();
const map = (a: string, x: (c:string, n:number) => {value: number}) => {}
map('v', test.method);
test.method('a', 123)
      `);

      const functionDeclaration = sourceFile.getClass("Test")?.getMethod("method");
      if (!functionDeclaration || !(functionDeclaration instanceof MethodDeclaration)) {
        throw new Error("test should be defined");
      }

      const typesOfFunction = getCallablesTypes(functionDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["string", "number"],
        ['"a"', "123"],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["any", "any"]);
      expect(
        Object.entries(typesOfFunction.usageInFunction()).map(([idx, types]) => [idx, getText(types)])
      ).toStrictEqual([]);
    });

    it("should return arguments and parameters types of method used as references in dotted parameters", () => {
      const sourceFile = createSourceFile(`
class Test {  method(c, x) {
  return { value: x };
} }
const test = new Test();
const arr: string[] = [];
arr.map(test.method);
test.method('a', 123)
      `);

      const functionDeclaration = sourceFile.getClass("Test")?.getMethod("method");
      if (!functionDeclaration || !(functionDeclaration instanceof MethodDeclaration)) {
        throw new Error("test should be defined");
      }

      const typesOfFunction = getCallablesTypes(functionDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["string", "number"],
        ['"a"', "123"],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["any", "any"]);
      expect(
        Object.entries(typesOfFunction.usageInFunction()).map(([idx, types]) => [idx, getText(types)])
      ).toStrictEqual([]);
    });
  });

  describe("for constructors", () => {
    it("should return arguments and parameters types of constructor", () => {
      const sourceFile = createSourceFile(`
let myVariable;
class Test { constructor(_a: number, _b: string) { } }
new Test(1, myVariable);
new Test(3, 'test');
      `);

      const functionDeclaration = sourceFile.getClass("Test")?.getConstructors()[0];
      if (!functionDeclaration || !(functionDeclaration instanceof ConstructorDeclaration)) {
        throw new Error("test should be defined");
      }

      const typesOfFunction = getCallablesTypes(functionDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["1", "any"],
        ["3", '"test"'],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["number", "string"]);
      expect(typesOfFunction.usageInFunction()).toStrictEqual({});
    });

    it("should return arguments and parameters types of constructor if there's any in the parameters", () => {
      const sourceFile = createSourceFile(`
let myVariable = 'value';
class Test { constructor(_a, _b) { } }
new Test(1, myVariable);
new Test(2, 'test');
      `);

      const functionDeclaration = sourceFile.getClass("Test")?.getConstructors()[0];
      if (!functionDeclaration || !(functionDeclaration instanceof ConstructorDeclaration)) {
        throw new Error("test should be defined");
      }
      const typesOfFunction = getCallablesTypes(functionDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["1", "string"],
        ["2", '"test"'],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["any", "any"]);
      expect(typesOfFunction.usageInFunction()).toStrictEqual({});
    });
  });

  describe("for function type", () => {
    it("should return arguments and parameters types of function type alias", () => {
      const sourceFile = createSourceFile(`
type Test =  (_a: number, _b: string) => void;     
let myVariable;
function withTest(test: Test) {
  test(1, myVariable);
  test(3, 'test');
}
      `);

      const functionTypeNodeDeclaration = sourceFile.getTypeAlias("Test")?.getTypeNode();
      if (!Node.isFunctionTypeNode(functionTypeNodeDeclaration)) {
        throw new Error(`There must be function type node in Test type`);
      }

      const typesOfFunction = getCallablesTypes(functionTypeNodeDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["1", "any"],
        ["3", '"test"'],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["number", "string"]);
      expect(typesOfFunction.usageInFunction()).toStrictEqual({});
    });

    it("should return arguments and parameters types of function type alias used as references", () => {
      const sourceFile = createSourceFile(`
type Test =  (c, x) => void;     
function map(a: string, x: (c:string, n:number) => {value: number}) {}

function withTest(test: Test) {
  map('v', test);
  test('a', 123)
}
      `);

      const functionTypeNodeDeclaration = sourceFile.getTypeAlias("Test")?.getTypeNode();
      if (!Node.isFunctionTypeNode(functionTypeNodeDeclaration)) {
        throw new Error(`There must be function type node in Test type`);
      }

      const typesOfFunction = getCallablesTypes(functionTypeNodeDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["string", "number"],
        ['"a"', "123"],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["any", "any"]);
      expect(typesOfFunction.usageInFunction()).toStrictEqual({});
    });

    it("should return arguments and parameters types of function type alias used as references if the type is a Union", () => {
      const sourceFile = createSourceFile(`
type Test =  (c, x) => void;     
function map(a: string, x: string | ((c:string, n:number) => {value: number})) {}

function withTest(test: Test) {
  map('v', test);
  test('a', 123)
}
      `);

      const functionTypeNodeDeclaration = sourceFile.getTypeAlias("Test")?.getTypeNode();
      if (!Node.isFunctionTypeNode(functionTypeNodeDeclaration)) {
        throw new Error(`There must be function type node in Test type`);
      }

      const typesOfFunction = getCallablesTypes(functionTypeNodeDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["string", "number"],
        ['"a"', "123"],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["any", "any"]);
      expect(typesOfFunction.usageInFunction()).toStrictEqual({});
    });

    it("should return arguments and parameters types of function type alias in interface", () => {
      const sourceFile = createSourceFile(`
interface Test { fn:  (_a: number, _b: string) => void }     
let myVariable;
function withTest(test: Test) {
  test.fn(1, myVariable);
  test.fn(3, 'test');
}
      `);

      const functionTypeNodeDeclaration = sourceFile.getInterface("Test")?.getProperty("fn")?.getTypeNode();

      if (!Node.isFunctionTypeNode(functionTypeNodeDeclaration)) {
        throw new Error(`There must be function type node in Test type`);
      }

      const typesOfFunction = getCallablesTypes(functionTypeNodeDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["1", "any"],
        ["3", '"test"'],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["number", "string"]);
      expect(typesOfFunction.usageInFunction()).toStrictEqual({});
    });

    it("should return arguments and parameters types of function type alias in type alia", () => {
      const sourceFile = createSourceFile(`
type Test = { fn:  (_a: number, _b: string) => void }     
let myVariable;
function withTest(test: Test) {
  test.fn(1, myVariable);
  test.fn(3, 'test');
}
      `);

      const aliasTypeNode = sourceFile.getTypeAlias("Test")?.getTypeNode();
      if (!Node.isTypeLiteral(aliasTypeNode)) {
        throw new Error(`Test must be a type literal`);
      }
      const functionTypeNodeDeclaration = aliasTypeNode.getProperty("fn")?.getTypeNode();

      if (!Node.isFunctionTypeNode(functionTypeNodeDeclaration)) {
        throw new Error(`There must be function type node in Test type`);
      }

      const typesOfFunction = getCallablesTypes(functionTypeNodeDeclaration);

      expect(typesOfFunction.argumentsTypes().map((s) => s.map((p) => getText(p)))).toStrictEqual([
        ["1", "any"],
        ["3", '"test"'],
      ]);
      expect(typesOfFunction.parameterTypes.map((p) => getText(p))).toStrictEqual(["number", "string"]);
      expect(typesOfFunction.usageInFunction()).toStrictEqual({});
    });
  });
});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.tsx", code);
}
