import { parseCliArgs } from "./cli-parser";

describe("cli-parser", () => {
  it("should return default cli value", () => {
    expect(parseCliArgs(["node", "script"])).toStrictEqual({
      file: null,
      noReverts: false,
      project: "./tsconfig.json",
      verbosity: 0,
    });
  });

  it("should support high level of verbosity", () => {
    expect(parseCliArgs(["node", "script", "-v", "-v"])).toStrictEqual({
      file: null,
      noReverts: false,
      project: "./tsconfig.json",
      verbosity: 2,
    });
  });

  it("should support middle level of verbosity", () => {
    expect(parseCliArgs(["node", "script", "-v"])).toStrictEqual({
      file: null,
      noReverts: false,
      project: "./tsconfig.json",
      verbosity: 1,
    });
  });
});
