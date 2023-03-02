# ts-remove-any

This project will replace automatically some implicit `any`s with most probable values.

If you try to activate [noImplicitAny](https://www.typescriptlang.org/tsconfig#noImplicitAny) on your
TypeScript project, but you're discouraged by the number of errors you see, this project is here for you.

It will rewrite part of your code, replacing implicit `any`s by a (probably) compatible type.

This project is conservative in the sense that it tries to minimize the number of fixes you have to do afterward.
It means that it won't fix _all_ your implicit `any`s, only those where there is a good chance to not be wrong.
But even like this that, there may still be some errors - it's to be expected as `any` is an escape hatch usually
used to prevent TypeScript to check properly the code.

## Usage

Run the following command at the root folder of your project:

```
npx ts-remove-any
```

Don't forget to re-run your formatter and typechecker afterward, `ts-remove-any` may reformat your code, and leave
some type errors.

More options are available, and can be found from the cli help.

---

[This bug](https://github.com/dsherret/ts-morph/pull/1380) in ts-morph is blocking some transformation if you're using
`ts-remove-any` from npx.
The other solution is [to clone the repository](github.com/blemoine/ts-remove-any), execute `npm install` and
then `npx ts-node src/index.ts`
That way a patch will be applied, and you will benefit from the latest feature of `ts-remove-any`



```
npx ts-remove-any --help
```

## Release procedure

```
./script/release.sh
```
