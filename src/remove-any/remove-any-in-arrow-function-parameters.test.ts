import { Project, SourceFile } from "ts-morph";
import { removeAny } from "./remove-any";
import { JsxEmit } from "typescript";

describe("remove-any", () => {
  it("should keep explicit `any`s for arrow function parameters", () => {
    const sourceFile = createSourceFile(`
const fnToIgnore = (my_explicit_variable: any) => {
  return { value: my_explicit_variable };
}

fnToIgnore(1234)`);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `const fnToIgnore = (my_explicit_variable: any) => {
    return { value: my_explicit_variable };
};
fnToIgnore(1234);
`
    );
  });

  it("should add explicit type for a any in arrow function parameters", () => {
    const sourceFile = createSourceFile(`
const fnToIgnore = (my_explicit_variable) => {
  return { value: my_explicit_variable };
}

fnToIgnore(1234)`);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `const fnToIgnore = (my_explicit_variable: 1234) => {
    return { value: my_explicit_variable };
};
fnToIgnore(1234);
`
    );
  });

  it("should set the type to union type if called with 4 numbers", () => {
    const sourceFile = createSourceFile(`
const fnToIgnore = (my_explicit_variable) => {
  return { value: my_explicit_variable };
}

fnToIgnore(1)
fnToIgnore(4)
fnToIgnore(3)
fnToIgnore(2)`);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `const fnToIgnore = (my_explicit_variable: 1 | 4 | 3 | 2) => {
    return { value: my_explicit_variable };
};
fnToIgnore(1);
fnToIgnore(4);
fnToIgnore(3);
fnToIgnore(2);
`
    );
  });

  it("should set the type to number if called with more than 4 numbers", () => {
    const sourceFile = createSourceFile(`
const fnToIgnore = (my_explicit_variable) => {
  return { value: my_explicit_variable };
}

fnToIgnore(1)
fnToIgnore(4)
fnToIgnore(3)
fnToIgnore(2)
fnToIgnore(5)`);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `const fnToIgnore = (my_explicit_variable: number) => {
    return { value: my_explicit_variable };
};
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
const fnToIgnore = (my_explicit_variable) => {
  return { value: my_explicit_variable };
}

fnToIgnore(true)
`);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `const fnToIgnore = (my_explicit_variable: boolean) => {
    return { value: my_explicit_variable };
};
fnToIgnore(true);
`
    );
  });

  it("should set the type to the transitively found type", () => {
    const sourceFile = createSourceFile(`
interface User { }        
const fnToIgnore = (my_explicit_variable) => {
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
const fnToIgnore = (my_explicit_variable: User) => {
    return { value: my_explicit_variable };
};
function callsite(n: User) {
    fnToIgnore(n);
}
`
    );
  });

  it("should set the type to string if more than 5 calls", () => {
    const sourceFile = createSourceFile(`
const fnToIgnore = (my_explicit_variable) => {
  return { value: my_explicit_variable };
}

fnToIgnore('1');
fnToIgnore('4');
fnToIgnore('3');
fnToIgnore('2');
fnToIgnore('5');
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `const fnToIgnore = (my_explicit_variable: string) => {
    return { value: my_explicit_variable };
};
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
const fnToIgnore = (my_explicit_variable) => {
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
      `const fnToIgnore = (my_explicit_variable: "1") => {
    return { value: my_explicit_variable };
};
fnToIgnore('1');
fnToIgnore('1');
fnToIgnore('1');
`
    );
  });

  it("should not set any", () => {
    const sourceFile = createSourceFile(`
const fnToIgnore = (my_explicit_variable) => {
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
      `const fnToIgnore = (my_explicit_variable) => {
    return { value: my_explicit_variable };
};
function callsite(n: any) {
    fnToIgnore(n);
}
`
    );
  });

  it("should use the usage type if possible", () => {
    const sourceFile = createSourceFile(`
const fnToIgnore = (my_explicit_variable) => {
  const a: number = my_explicit_variable;
  return a;
}

function callsite(n: any) {
   fnToIgnore(n);
}
`);

    const numberOfChanges = removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `const fnToIgnore = (my_explicit_variable: number) => {
    const a: number = my_explicit_variable;
    return a;
};
function callsite(n: any) {
    fnToIgnore(n);
}
`
    );
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
  });

  it("should use the usage type in function call  if possible", () => {
    const sourceFile = createSourceFile(`
const fnToIgnore = (my_explicit_variable) => {
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
      `const fnToIgnore = (my_explicit_variable: string) => {
    wellDefinedFn(my_explicit_variable);
};
function wellDefinedFn(x: string) { }
function callsite(n: any) {
    fnToIgnore(n);
}
`
    );
  });

  it("should use the usage type in method call if possible", () => {
    const sourceFile = createSourceFile(`
const fnToIgnore = (my_explicit_variable) => {
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
      `const fnToIgnore = (my_explicit_variable: string) => {
    const test = new Test();
    test.wellDefinedFn(1, my_explicit_variable);
};
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
const fnToIgnore = (my_explicit_variable) => {
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
      `const fnToIgnore = (my_explicit_variable: string) => {
    return { value: my_explicit_variable };
};
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
const fnToIgnore = (my_explicit_variable) => {
  return { value: my_explicit_variable };
}
function map(x: (n: number) => {
    value: number;
}) { }

const arr: number[] = [];
map(fnToIgnore);
`);

    const numberOfChanges = removeAny(sourceFile);

    expect(sourceFile.print()).toStrictEqual(
      `const fnToIgnore = (my_explicit_variable: number) => {
    return { value: my_explicit_variable };
};
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
const fnToIgnore = (my_explicit_variable) => {
  return { value: my_explicit_variable };
}

const arr: number[] = [];
arr.map(fnToIgnore);
`);

    const numberOfChanges = removeAny(sourceFile);

    expect(sourceFile.print()).toStrictEqual(
      `const fnToIgnore = (my_explicit_variable: number) => {
    return { value: my_explicit_variable };
};
const arr: number[] = [];
arr.map(fnToIgnore);
`
    );
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
  });

  it("should set the type even in a beta reduction case with dotted property and the callback is the 2nd parameter", () => {
    const sourceFile = createSourceFile(`
const fnToIgnore = (my_explicit_variable) => {
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
      `const fnToIgnore = (my_explicit_variable: number) => {
    return { value: my_explicit_variable };
};
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

  it("should find the type of child component calls in JSX", () => {
    const sourceFile = createSourceFile(`
interface User { name: string }
const ChildComponent =  ({childTitle, childUser, childName}: {childTitle: string, childUser: User, childName: string}) => {
  return <div>{childTitle} / {childUser.name}</div>
}
     
const ParentComponent = ({title:page_title, user, name}) => {
    const childName = name ?? 'defaultValue';
  return <ChildComponent childTitle={page_title} childUser={user} childName={childName}/>
}
`);
    const numberOfChanges = removeAny(sourceFile, { verbosity: 2 });

    expect(sourceFile.print()).toStrictEqual(
      `interface User {
    name: string;
}
const ChildComponent = ({ childTitle, childUser, childName }: {
    childTitle: string;
    childUser: User;
    childName: string;
}) => {
    return <div>{childTitle} / {childUser.name}</div>;
};
const ParentComponent = ({ title: page_title, user, name }: {
    title: string;
    user: User;
    name: string | null | undefined;
}) => {
    const childName = name ?? 'defaultValue';
    return <ChildComponent childTitle={page_title} childUser={user} childName={childName}/>;
};
`
    );
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
  });

  it("should deduce the type from jsx callback", () => {
    const sourceFile = createSourceFile(`
const ChildComponent = (props: {onError: (str:string) => void}) => <div></div>
const ParentComponent = () => {
    const handleError = (err) => {}

    return <ChildComponent onError={handleError} />
}
`);

    const numberOfChanges = removeAny(sourceFile);

    expect(sourceFile.print()).toStrictEqual(
      `const ChildComponent = (props: {
    onError: (str: string) => void;
}) => <div></div>;
const ParentComponent = () => {
    const handleError = (err: string) => { };
    return <ChildComponent onError={handleError}/>;
};
`
    );
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
  });

  it("should type function used in alias", () => {
    const sourceFile = createSourceFile(`
type Options = (s:string) => void; 
const fn = (s) => { };
const a: Options = fn;
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `type Options = (s: string) => void;
const fn = (s: string) => { };
const a: Options = fn;
`
    );
  });

  it("should type function used in property assignment", () => {
    const sourceFile = createSourceFile(`
type Options = {test: (s:string) => void}; 
const fn = (s) => { };
const a: Options = {test: fn};
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `type Options = {
    test: (s: string) => void;
};
const fn = (s: string) => { };
const a: Options = { test: fn };
`
    );
  });

  it("should type function used in shorthand property assignment", () => {
    const sourceFile = createSourceFile(`
type Options = {test: (s:string) => void}; 
const test = (s) => { };
const a: Options = {test};
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `type Options = {
    test: (s: string) => void;
};
const test = (s: string) => { };
const a: Options = { test };
`
    );
  });

  it("should type function used as reference", () => {
    const sourceFile = createSourceFile(`
type Options = { inner: (s:string) => void };
type Options2 = {test: { inner2: (n: number, b: boolean) => void }};      
function parentFn(options: Options, options2: Options2) {} 
const fn = (s) => {};
const fn2 = (s, b) => {};
parentFn({inner: fn}, {test:{inner2: fn2}});
`);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `type Options = {
    inner: (s: string) => void;
};
type Options2 = {
    test: {
        inner2: (n: number, b: boolean) => void;
    };
};
function parentFn(options: Options, options2: Options2) { }
const fn = (s: string) => { };
const fn2 = (s: number, b: boolean) => { };
parentFn({ inner: fn }, { test: { inner2: fn2 } });
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
