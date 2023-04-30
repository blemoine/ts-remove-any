import { Project, SourceFile } from "ts-morph";
import { removeAny } from "./remove-any";
import { JsxEmit } from "typescript";

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
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
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
    expect(numberOfChanges.countChangesDone).toBe(0);
    expect(numberOfChanges.countOfAnys).toBe(1);
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
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
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

  it("should use deduce that template usage is a string", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
  const a = \`da \${my_explicit_variable}\`;
}
`);

    const numberOfChanges = removeAny(sourceFile);

    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: string) {
    const a = \`da \${my_explicit_variable}\`;
}
`
    );
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
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
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
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
  });

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
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
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
  });

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
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
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
function map(x: (n: number) => {value: number}) {}

const arr: number[] = [];
map(fnToIgnore);
`);

    const numberOfChanges = removeAny(sourceFile);

    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: number) {
    return { value: my_explicit_variable };
}
function map(x: (n: number) => {
    value: number;
}) { }
const arr: number[] = [];
map(fnToIgnore);
`
    );
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
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
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
  });

  it("should set the type when used with sort", () => {
    const sourceFile = createSourceFile(`
function cmp(a, b) {
  return a + b;
}

const arr: number[] = [];
arr.sort(cmp);
`);

    const numberOfChanges = removeAny(sourceFile);

    expect(sourceFile.print()).toStrictEqual(
      `function cmp(a: number, b: number) {
    return a + b;
}
const arr: number[] = [];
arr.sort(cmp);
`
    );
    expect(numberOfChanges.countChangesDone).toBe(2);
    expect(numberOfChanges.countOfAnys).toBe(2);
  });

  it("should set the type when using arithmetic operators", () => {
    const sourceFile = createSourceFile(`
function cmp(a, b) {
  return a - b;
}
`);

    const numberOfChanges = removeAny(sourceFile);

    expect(sourceFile.print()).toStrictEqual(
      `function cmp(a: number, b: number) {
    return a - b;
}
`
    );
    expect(numberOfChanges.countChangesDone).toBe(2);
    expect(numberOfChanges.countOfAnys).toBe(2);
  });

    it("should set the type when using boolean operators", () => {
        const sourceFile = createSourceFile(`
function cmp(a, b) {
  return a && b;
}
`);

        const numberOfChanges = removeAny(sourceFile);

        expect(sourceFile.print()).toStrictEqual(
            `function cmp(a: boolean, b: boolean) {
    return a && b;
}
`
        );
        expect(numberOfChanges.countChangesDone).toBe(2);
        expect(numberOfChanges.countOfAnys).toBe(2);
    })

  it("should set the type when using unary operator", () => {
    const sourceFile = createSourceFile(`
function cmp(a:string, b) {
  return -b;
}
`);

    const numberOfChanges = removeAny(sourceFile);

    expect(sourceFile.print()).toStrictEqual(
      `function cmp(a: string, b: number) {
    return -b;
}
`
    );
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
  });

  it("should set the type from anys array", () => {
    const sourceFile = createSourceFile(`
function fn(arr: number[]){}      
const operators = [];
fn(operators);      
      `);

    const numberOfChanges = removeAny(sourceFile);

    expect(sourceFile.print()).toStrictEqual(
      `function fn(arr: number[]) { }
const operators: number[] = [];
fn(operators);
`
    );
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
  });

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
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
  });

  it("should set the type from the usage in react components", () => {
    const sourceFile = createSourceFile(`
const Input = (props: { type: string, "data-id"?: string, id?: string, value: string | string[] | number}) => <></>;
export function HiddenInput(props) {
  return (
    <Input
      type="hidden"
      data-id={props.field.key}
      id={props.input_id}
      value={props.input_state.value}
    />
  );
}
`);

    const numberOfChanges = removeAny(sourceFile, { verbosity: 2 });

    expect(sourceFile.print()).toStrictEqual(
      `const Input = (props: {
    type: string;
    "data-id"?: string;
    id?: string;
    value: string | string[] | number;
}) => <></>;
export function HiddenInput(props: {
    "field": {
        "key": string;
    };
    "input_id": string;
    "input_state": {
        "value": string | number | string[];
    };
}) {
    return (<Input type="hidden" data-id={props.field.key} id={props.input_id} value={props.input_state.value}/>);
}
`
    );
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
  });

  it("should type with tuples", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
}
fnToIgnore([1,2,3] as const);
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: readonly [
    1,
    2,
    3
]) {
}
fnToIgnore([1, 2, 3] as const);
`
    );
  });

  it("should type with null", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
}
fnToIgnore(null);
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: null) {
}
fnToIgnore(null);
`
    );
  });

  it("should type with undefined", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
}
fnToIgnore(undefined);
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: undefined) {
}
fnToIgnore(undefined);
`
    );
  });

  it("should type with a function", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
}
fnToIgnore((x: string) => 2);
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: (x: string) => number) {
}
fnToIgnore((x: string) => 2);
`
    );
  });

  it("should type with unknown", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore(my_explicit_variable) {
}
function fn2(x: unknown) {
    fnToIgnore(x);
}
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore(my_explicit_variable: unknown) {
}
function fn2(x: unknown) {
    fnToIgnore(x);
}
`
    );
  });

  it("should type with array push", () => {
    const sourceFile = createSourceFile(`
let arr: string[];        
function fnToIgnore(my_explicit_variable) {
   arr.push(my_explicit_variable);
}
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `let arr: string[];
function fnToIgnore(my_explicit_variable: string) {
    arr.push(my_explicit_variable);
}
`
    );
  });

  it("should type with aliased function", () => {
    const sourceFile = createSourceFile(`
type Fn = (x: string) => number;
function fnToIgnore(my_explicit_variable) {
}
function fn2(x: Fn) {
    fnToIgnore(x);
}
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `type Fn = (x: string) => number;
function fnToIgnore(my_explicit_variable: Fn) {
}
function fn2(x: Fn) {
    fnToIgnore(x);
}
`
    );
  });

  it("should type with aliased array", () => {
    const sourceFile = createSourceFile(`
type Arr = string[];
function fnToIgnore(my_explicit_variable) {
}
function fn2(x: Arr) {
    fnToIgnore(x);
}
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `type Arr = string[];
function fnToIgnore(my_explicit_variable: Arr) {
}
function fn2(x: Arr) {
    fnToIgnore(x);
}
`
    );
  });

  it("should type with aliased tuple", () => {
    const sourceFile = createSourceFile(`
type Arr = [string, boolean];
function fnToIgnore(my_explicit_variable) {
}
function fn2(x: Arr) {
    fnToIgnore(x);
}
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `type Arr = [
    string,
    boolean
];
function fnToIgnore(my_explicit_variable: Arr) {
}
function fn2(x: Arr) {
    fnToIgnore(x);
}
`
    );
  });

  it("should type with a type parameter", () => {
    const sourceFile = createSourceFile(`
function fnToIgnore<T>(my_explicit_variable): T {
    return my_explicit_variable;
}
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `function fnToIgnore<T>(my_explicit_variable: T): T {
    return my_explicit_variable;
}
`
    );
  });

  it("should type with a type having generic parameters", () => {
    const sourceFile = createSourceFile(`
interface Gen<A, B> {
a: A 
b: B
}        
function fnToIgnore(my_explicit_variable) {
    return my_explicit_variable;
}

function use(gen: Gen<string, number>) {
    fnToIgnore(gen)
}

`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `interface Gen<A, B> {
    a: A;
    b: B;
}
function fnToIgnore(my_explicit_variable: Gen<string, number>) {
    return my_explicit_variable;
}
function use(gen: Gen<string, number>) {
    fnToIgnore(gen);
}
`
    );
  });

  it("should type function used as reference", () => {
    const sourceFile = createSourceFile(`
type Options = { inner: (s:string) => void };      
function parentFn(options: Options) {} 
function fn(s) {}
parentFn({inner: fn});
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `type Options = {
    inner: (s: string) => void;
};
function parentFn(options: Options) { }
function fn(s: string) { }
parentFn({ inner: fn });
`
    );
  });

  it("should type with a type having generic parameters for type alias", () => {
    const sourceFile = createSourceFile(`
type Gen<A, B> = {
a: A 
b: B
}        
function fnToIgnore(my_explicit_variable) {
    return my_explicit_variable;
}

function use(gen: Gen<string, number>) {
    fnToIgnore(gen)
}

`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `type Gen<A, B> = {
    a: A;
    b: B;
};
function fnToIgnore(my_explicit_variable: Gen<string, number>) {
    return my_explicit_variable;
}
function use(gen: Gen<string, number>) {
    fnToIgnore(gen);
}
`
    );
  });
});

function createSourceFile(code: string): SourceFile {
  const project = new Project({
    compilerOptions: {
      jsx: JsxEmit.ReactJSX,
    },
  });
  return project.createSourceFile("/tmp/not_used.tsx", code);
}
