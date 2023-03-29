import { Project, SourceFile } from "ts-morph";
import { removeAny } from "./remove-any";
import { JsxEmit } from "typescript";

describe("remove in let declaration", () => {
  it("should add a type in let declaration", () => {
    const sourceFile = createSourceFile(`
let x;
x = 1;
`);

    const numberOfChanges = removeAny(sourceFile);
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
    expect(sourceFile.print()).toStrictEqual(
      `let x: 1;
x = 1;
`
    );
  });

  it("should add a type in let declaration inside functions", () => {
    const sourceFile = createSourceFile(`
before(() => {        
    let x;
    it(() => { x = 'test' });
});
`);

    const numberOfChanges = removeAny(sourceFile);
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
    expect(sourceFile.print()).toStrictEqual(
      `before(() => {
    let x: "test";
    it(() => { x = 'test'; });
});
`
    );
  });

  it("should not do a change if doesn't compile", () => {
    const sourceFile = createSourceFile(`
let x;
x = {};
x.test = 2;
`);

    const numberOfChanges = removeAny(sourceFile);

    expect(sourceFile.print()).toStrictEqual(
      `let x;
x = {};
x.test = 2;
`
    );
    expect(numberOfChanges.countChangesDone).toBe(0);
    expect(numberOfChanges.countOfAnys).toBe(1);
  });

  it("should add an array type in JSX", () => {
    const sourceFile = createSourceFile(`
interface Props { arr: string[] }
const MyComponent = (props: Props) => <div></div>

function wrapper() {
    const ParentComponent = () => {
       const test = []
       return <MyComponent arr={test} />
    }
}
`);

    const numberOfChanges = removeAny(sourceFile);
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
    expect(sourceFile.print()).toStrictEqual(
      `interface Props {
    arr: string[];
}
const MyComponent = (props: Props) => <div></div>;
function wrapper() {
    const ParentComponent = () => {
        const test: string[] = [];
        return <MyComponent arr={test}/>;
    };
}
`
    );
  });

  it("should deduce the type from jsx callback with spread", () => {
    const sourceFile = createSourceFile(`
const ChildComponent = (props: {name: string}) => <div></div>
let defaultProps;
const ParentComponent = () => {
    return <ChildComponent {...defaultProps} />
}
`);

    const numberOfChanges = removeAny(sourceFile);

    expect(sourceFile.print()).toStrictEqual(
      `const ChildComponent = (props: {
    name: string;
}) => <div></div>;
let defaultProps: {
    "name": string;
};
const ParentComponent = () => {
    return <ChildComponent {...defaultProps}/>;
};
`
    );
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
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
