import { parseCliArgs } from "./cli-parser";

describe("cli-parser", () => {
  it("should return default cli value", () => {
    expect(parseCliArgs(["node", "script"])).toStrictEqual({
      file: null,
      noReverts: false,
      project: "./tsconfig.json",
      verbosity: 0,
      explicit: false,
    });
  });

  it("should support high level of verbosity", () => {
    expect(parseCliArgs(["node", "script", "-v", "-v"])).toStrictEqual({
      file: null,
      noReverts: false,
      project: "./tsconfig.json",
      verbosity: 2,
      explicit: false,
    });
  });

  it("should support middle level of verbosity", () => {
    expect(parseCliArgs(["node", "script", "-v"])).toStrictEqual({
      file: null,
      noReverts: false,
      project: "./tsconfig.json",
      verbosity: 1,
      explicit: false,
    });
  });

  it("should support explicit flag", () => {
    expect(parseCliArgs(["node", "script", "-e"])).toStrictEqual({
      file: null,
      noReverts: false,
      project: "./tsconfig.json",
      verbosity: 0,
      explicit: true,
    });
  });
  it("should support revert flag", () => {
    expect(parseCliArgs(["node", "script", "-r"])).toStrictEqual({
      file: null,
      noReverts: true,
      project: "./tsconfig.json",
      verbosity: 0,
      explicit: false,
    });
  });
});
