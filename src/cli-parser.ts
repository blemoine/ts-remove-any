import { Command } from "commander";

interface CliArgs {
  verbosity: number;
  project: string;
  file: string | null;
  noReverts: boolean;
  explicit: boolean;
  dryRun: boolean;
}

export function parseCliArgs(args: string[]): CliArgs {
  const program = new Command();
  program.name("ts-remove-any").description("CLI to remove some implicit any");
  program.option(
    "-v, --verbose",
    "increase verbosity. Pass the argument multiple times to get even more verbose.",
    (_dummyValue: unknown, previous: number) => previous + 1,
    0
  );
  program.option("-p, --project <value>", "path of the tsconfig file", "./tsconfig.json");
  program.option("-f, --file <value>", "remove any only int the specified file");
  program.option("-r, --prevent-reverts", "don't revert files in case of errors");
  program.option("-e, --explicit", "try to convert explicit any too");
  program.option("-d, --dry-run", "display the change that would be done, but don't actually make them");
  program.parse(args);

  const opts = program.opts();

  return {
    verbosity: opts.verbose || 0,
    project: opts.project,
    file: opts.file || null,
    noReverts: opts.preventReverts || false,
    explicit: opts.explicit || false,
    dryRun: opts.dryRun || false,
  };
}
