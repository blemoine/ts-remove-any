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

});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.ts", code);
}
