import { Project, SourceFile } from "ts-morph";
import { removeAny } from "./remove-any";

describe("remove-any", () => {
  it("should find remove any in constructor based on call", () => {
    const sourceFile = createSourceFile(`
class A {
    constructor(private value){}
}

new A('test');
    `);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `class A {
    constructor(private value: "test") { }
}
new A('test');
`
    );
  });

  it("should remove any in attributes", () => {
    const sourceFile = createSourceFile(`
class A {
    public value;
}

const a = new A();
Number.parseInt(a.value);
    `);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `class A {
    public value: string;
}
const a = new A();
Number.parseInt(a.value);
`
    );
  });

  it("should remove any in attributes based on method", () => {
    const sourceFile = createSourceFile(`
class A {
    private value;
    doSomething() {
        return Math.min(this.value, 0)
    }
}
    `);

    removeAny(sourceFile, { verbosity: 2 });
    expect(sourceFile.print()).toStrictEqual(
      `class A {
    private value: number;
    doSomething() {
        return Math.min(this.value, 0);
    }
}
`
    );
  });

  it("should find remove any in method based on call", () => {
    const sourceFile = createSourceFile(`
class A {
    myMethod(value){}
}
const a = new A();
a.myMethod(12);
    `);

    removeAny(sourceFile);
    expect(sourceFile.print()).toStrictEqual(
      `class A {
    myMethod(value: 12) { }
}
const a = new A();
a.myMethod(12);
`
    );
  });
});

function createSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("/tmp/not_used.ts", code);
}
