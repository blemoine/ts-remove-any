import { Project, SourceFile } from "ts-morph";
import { removeAny } from "./remove-any";

describe("remove-any", () => {
  it("should find the type for react props", () => {
    const sourceFile = createSourceFile(`function MyComponent({ value }) { return Number.parseInt(value); }`);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `function MyComponent({ value }: {
    value: string;
}) { return Number.parseInt(value); }
`
    );
  });

  it("should find the type for react props in arrow components", () => {
    const sourceFile = createSourceFile(`const MyComponent = ({ value }) => Number.parseInt(value);`);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `const MyComponent = ({ value }: {
    value: string;
}) => Number.parseInt(value);
`
    );
  });

  it("should not set the type if the type system is able to infer it", () => {
    const sourceFile = createSourceFile(`
const arr: {val: number}[] = [];
arr.map(({val}) => i);        
`);

    const numberOfChanges = removeAny(sourceFile);

    expect(sourceFile.print()).toStrictEqual(
      `const arr: {
    val: number;
}[] = [];
arr.map(({ val }) => i);
`
    );
    expect(numberOfChanges.countChangesDone).toBe(0);
    expect(numberOfChanges.countOfAnys).toBe(0);
  });

  it("should set the type if the type system is able to infer it even if there an any", () => {
    const sourceFile = createSourceFile(`
const arr: {val: number, x: any}[] = [];
arr.map(({val}) => i);        
`);

    const numberOfChanges = removeAny(sourceFile);

    expect(sourceFile.print()).toStrictEqual(
      `const arr: {
    val: number;
    x: any;
}[] = [];
arr.map(({ val }: {
    val: number;
    x: any;
}) => i);
`
    );
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
  });

  it("should deduce the type from returned value", () => {
    const sourceFile = createSourceFile(`
function({value}): string { if(true) { return value } }
`);

    const numberOfChanges = removeAny(sourceFile);

    expect(sourceFile.print()).toStrictEqual(
      `function ({ value }: {
    value: string;
}): string { if (true) {
    return value;
} }
`
    );
    expect(numberOfChanges.countChangesDone).toBe(1);
    expect(numberOfChanges.countOfAnys).toBe(1);
  });
});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.tsx", code);
}
