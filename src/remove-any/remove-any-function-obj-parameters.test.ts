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
});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.ts", code);
}
