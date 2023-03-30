# ts-remove-any

`ts-remove-any` will replace automatically some implicit `any`s with a compatible type.

## Motivation

If you have an existing TypeScript project, you may want to turn [noImplicitAny](https://www.typescriptlang.org/tsconfig#noImplicitAny) on,
as it really helps to find errors at build time instead of waiting for the program to crash.

But if your project was not started with this option activated, you may be discouraged by the number of errors appearing
when turning it on.

If that's the case, `ts-remove-any` is here for you: it will rewrite part of your code, replacing implicit `any`s by a (probably) compatible type.

This project is conservative in the sense that it tries to minimize the number of fixes you have to do afterward.
It means that it won't fix _all_ your implicit `any`s, only those with a good chance to not be wrong.
But even like this that, there may still be some errors - it's to be expected as `any` is an escape hatch usually
used to prevent TypeScript to check properly the code.

So this project won't save you some manual fix of your code, but it will at least help you in the task.

## Usage

Run the following command at the root folder of your project:

```
npx ts-remove-any
```

Don't forget to run your formatter (eg. `prettier`) and typechecker (eg. `tsc`) afterward, `ts-remove-any` may reformat your code, and leave
some type errors.

More options are available, and can be found from the cli help.

| Option | Effect                                                                                                                                                                                   |
| ------ |------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| -v     | increase the verbosity, ie. the amount of logs displayed. Can be double to see even more logs: `-v -v`                                                                                   |
| -p     | the path of tsconfig.json file to use                                                                                                                                                    |
| -f     | a pattern against which the file name and path will be matched. <br/>Useful if you want to run `ts-remove-any` only on one file, or group of files                                       |
| -r     | don't revert the code in case of errors. <br/>`ts-remove-any` may generate invalid types, this option will ensure that we keep those types. They may be used as a basis for a manual fix |
| -d     | dry-run, don't apply any change, but display a log of the changes that would be made                                                                                                     |
| --help | display a contextual help                                                                                                                                                                |

---

It could be useful to run the script multiple times, until the number of changes done are 0:
each time `ts-remove-any` removes some `any`s, new types are available to analysis and remove other `any`s.

This is not done automatically as you may want to check intermediate results between run, to ensure types generated are valid.


## Release procedure

```
./script/release.sh
```
