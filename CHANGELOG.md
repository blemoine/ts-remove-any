# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.2.2](https://github.com/blemoine/ts-remove-any/compare/v0.2.1...v0.2.2) (2023-04-17)


### Features

* better support for literals ([a61bd3e](https://github.com/blemoine/ts-remove-any/commit/a61bd3ec9dfc2cff41b282b83f3ce8899ce6bd5b))

### [0.2.1](https://github.com/blemoine/ts-remove-any/compare/v0.1.61...v0.2.1) (2023-04-12)


### Features

* add support for id for dedup ([1aad90e](https://github.com/blemoine/ts-remove-any/commit/1aad90e177a224e936cbc7d6db95e2634a976200))
* remove useless references to original type ([4e32288](https://github.com/blemoine/ts-remove-any/commit/4e3228822b6876f0574f5e4f97dbcb9cf0dd5d80))

### [0.1.61](https://github.com/blemoine/ts-remove-any/compare/v0.1.60...v0.1.61) (2023-04-11)


### Features

* prevent inifinite loop ([3c8012e](https://github.com/blemoine/ts-remove-any/commit/3c8012e5502a1e79a884a0f3517f93aad7bb0669))

### [0.1.60](https://github.com/blemoine/ts-remove-any/compare/v0.1.59...v0.1.60) (2023-04-10)


### Bug Fixes

* prevent infinite loop ([7514d8e](https://github.com/blemoine/ts-remove-any/commit/7514d8eba533395b7e84f683fee3f7ac623fbdcb))

### [0.1.59](https://github.com/blemoine/ts-remove-any/compare/v0.1.58...v0.1.59) (2023-04-10)


### Features

* add better support for type from usage ([e2bdb51](https://github.com/blemoine/ts-remove-any/commit/e2bdb51c194f0f584c2d3f08475767ab861694b1))
* improve type definition for callables ([170a5e1](https://github.com/blemoine/ts-remove-any/commit/170a5e1b1ba1045ab87bc6feea52fea4eb45d252))
* introduce equation model ([ccd88c4](https://github.com/blemoine/ts-remove-any/commit/ccd88c4751d624c54872b8a34402b0ecd47e9971))

### [0.1.58](https://github.com/blemoine/ts-remove-any/compare/v0.1.57...v0.1.58) (2023-04-04)


### Bug Fixes

* unifier when the function has no type ([c6390de](https://github.com/blemoine/ts-remove-any/commit/c6390de73b5334007ce86470e0129e54c3a699ee))

### [0.1.57](https://github.com/blemoine/ts-remove-any/compare/v0.1.56...v0.1.57) (2023-04-04)


### Features

* continue in case of errors ([ec6ebb0](https://github.com/blemoine/ts-remove-any/commit/ec6ebb0199e82a4b36e9acb6c5cd3c8f20a2bd13))

### [0.1.56](https://github.com/blemoine/ts-remove-any/compare/v0.1.55...v0.1.56) (2023-04-04)


### Features

* better support for classes and spread ([8fe463e](https://github.com/blemoine/ts-remove-any/commit/8fe463ecb56d3ff0d4c3fb1dbdaed6155f3d2e8c))

### [0.1.55](https://github.com/blemoine/ts-remove-any/compare/v0.1.54...v0.1.55) (2023-04-04)


### Features

* better revert of explicit any ([38d7b70](https://github.com/blemoine/ts-remove-any/commit/38d7b70eef9ec82e1188ae8776b71a38f5b1aa04))
* better support for class attributes ([0da114d](https://github.com/blemoine/ts-remove-any/commit/0da114de7a1ef0792311ae1beb6ffffea3daa51b))

### [0.1.54](https://github.com/blemoine/ts-remove-any/compare/v0.1.53...v0.1.54) (2023-04-01)


### Features

* add alias everywhere ([98e4456](https://github.com/blemoine/ts-remove-any/commit/98e445687a21dcf79c1d23e7056a735b6ff02924))
* add better support for imports ([ebe32de](https://github.com/blemoine/ts-remove-any/commit/ebe32de70a1397061e057e3376722bd13bf59072))
* add some support for enums ([fb49c91](https://github.com/blemoine/ts-remove-any/commit/fb49c919eb7d165a5c1be38888f98c8af17fcf8d))
* better handling of import revert ([401bc07](https://github.com/blemoine/ts-remove-any/commit/401bc0718ad61c6d669c7482226140e67467064a))
* don't add () on intersection ([a367e10](https://github.com/blemoine/ts-remove-any/commit/a367e108293b5964c1e5b0857ab4a9e0cf3715a8))
* ignore catch in promises ([649e2da](https://github.com/blemoine/ts-remove-any/commit/649e2da4fc14059ff08f95acbd68d361c2871083))
* remove parenthesized any ([148f7e2](https://github.com/blemoine/ts-remove-any/commit/148f7e25ee2c9209e7693bf074f5ec8b033b55d4))
* use a better import model ([9bab1c4](https://github.com/blemoine/ts-remove-any/commit/9bab1c409f90bc24e23595ce541a06687e53cab9))

### [0.1.53](https://github.com/blemoine/ts-remove-any/compare/v0.1.52...v0.1.53) (2023-03-30)

### [0.1.52](https://github.com/blemoine/ts-remove-any/compare/v0.1.51...v0.1.52) (2023-03-30)


### Features

* add base support for import ([fd247e0](https://github.com/blemoine/ts-remove-any/commit/fd247e0d235a7fb3be4b65e59294dc695c1985c2))
* add better support for import ([4047478](https://github.com/blemoine/ts-remove-any/commit/4047478e4cd33d97aa31194e271f3cc3b6d8092e))
* add better support for import ([f83199f](https://github.com/blemoine/ts-remove-any/commit/f83199ffce764d8b356c79eaf9b5db44d8a2967e))
* add better support for import ([52f49a6](https://github.com/blemoine/ts-remove-any/commit/52f49a6e7086767fb19ecb5285e7b3cdad60faa0))
* add better support for imports ([dda8cf8](https://github.com/blemoine/ts-remove-any/commit/dda8cf8a095e76cdf96aed820f6d999387d53f4a))
* add support for class import ([bb34732](https://github.com/blemoine/ts-remove-any/commit/bb347324c8bf0ca0b21089b439d1438939ca261f))
* better handling of imports ([24e3705](https://github.com/blemoine/ts-remove-any/commit/24e3705027cbf988064a411fea8a48bd0204610f))
* deduplicate imports ([22b85a3](https://github.com/blemoine/ts-remove-any/commit/22b85a38635a141b9795fc77028b8e446c378d2a))
* revert for import ([8b01b3c](https://github.com/blemoine/ts-remove-any/commit/8b01b3ca5f58fc5acc6a17fe21802b895a340a1b))

### [0.1.51](https://github.com/blemoine/ts-remove-any/compare/v0.1.50...v0.1.51) (2023-03-28)


### Features

* add support for function references ([a577b38](https://github.com/blemoine/ts-remove-any/commit/a577b38d915ce5a5ad2c55fa869650b4fc434242))
* add support for shorthand properties ([9d51aa2](https://github.com/blemoine/ts-remove-any/commit/9d51aa2d5b81d91bdb14142621b1ac868b8d0ea6))
* add support for type used as alias ([593c664](https://github.com/blemoine/ts-remove-any/commit/593c664280fbe79f6a007784665d9b22bc21e439))
* better support for variable used by reference ([2f94f70](https://github.com/blemoine/ts-remove-any/commit/2f94f704fbc29681bf8fb069cad2d6670e2b1885))
* ignore object with a lot of properties ([5ec3bef](https://github.com/blemoine/ts-remove-any/commit/5ec3bef35e75e8cb0e281480e4183414903dcac5))
* remove local path in import ([18c5d39](https://github.com/blemoine/ts-remove-any/commit/18c5d39ab34ff66a2e93cea92e1630b4cd6dd52f))

### [0.1.50](https://github.com/blemoine/ts-remove-any/compare/v0.1.49...v0.1.50) (2023-03-26)


### Features

* add support for generics ([2806f51](https://github.com/blemoine/ts-remove-any/commit/2806f511f693157e7352d290e736c2b54b0bde31))
* add support for template span ([a92f8cf](https://github.com/blemoine/ts-remove-any/commit/a92f8cf2e7b62c0d7d8a8c3f35d60fd686915901))
* better destructuring support ([15c7326](https://github.com/blemoine/ts-remove-any/commit/15c73266be99a6fbd83a67f83e1904a8ac2d9322))

### [0.1.49](https://github.com/blemoine/ts-remove-any/compare/v0.1.48...v0.1.49) (2023-03-25)


### Features

* add support for spread ([7a32a33](https://github.com/blemoine/ts-remove-any/commit/7a32a336c4af2a330e0c2c831087b7016cf48b85))
* filter out catch clause ([a73e0b3](https://github.com/blemoine/ts-remove-any/commit/a73e0b38c749cf8a80d423fec7023550d7cb015d))


### Bug Fixes

* ignore global for alais ([9c53368](https://github.com/blemoine/ts-remove-any/commit/9c5336883fb4204e074ccac08e6128cf52a6a600))

### [0.1.48](https://github.com/blemoine/ts-remove-any/compare/v0.1.47...v0.1.48) (2023-03-25)


### Features

* add preliminary support for intersection ([9beaca6](https://github.com/blemoine/ts-remove-any/commit/9beaca6065eeb63d211960dd723d640fce06c997))
* add support for aliased union/intersection ([e3ca0de](https://github.com/blemoine/ts-remove-any/commit/e3ca0de9e72e70e3a3e28452905d2db2e91aba25))
* add support for dry-run ([e9a4e49](https://github.com/blemoine/ts-remove-any/commit/e9a4e494be2f95d94064f3e3185a7a46702a7af1))
* add support for lazy parameters ([a68836c](https://github.com/blemoine/ts-remove-any/commit/a68836ceb8a953bdee6a8f6b0e446171ec71ae7b))
* add support for merging intersection ([b4d0bb2](https://github.com/blemoine/ts-remove-any/commit/b4d0bb24416438b4b79d3e4c626587a1d9e769f7))
* remove badly formated type ([562c8c0](https://github.com/blemoine/ts-remove-any/commit/562c8c047d7edb4aeb385993b09341221e5bbd93))
* remove nullable ([c8d2301](https://github.com/blemoine/ts-remove-any/commit/c8d23013c8352283f12f26902bf2fe59b5df0cda))
* remove unknown ([036572e](https://github.com/blemoine/ts-remove-any/commit/036572ebdc172b5831b72fe39a7bcf5c3b6359e1))
* support for union deduplication ([70d3b44](https://github.com/blemoine/ts-remove-any/commit/70d3b445fec073fadcaa48bde89081fee8608914))
* use fully qualified alias ([eb55663](https://github.com/blemoine/ts-remove-any/commit/eb556637a5a83624916e566a8ecf135cf896bd1e))


### Bug Fixes

* prevent crash for alias ([f186a53](https://github.com/blemoine/ts-remove-any/commit/f186a530c2db42098c2d914f4b3c8cc9bc9fe5c0))
* prevent crash if only one member in union(?) ([edfbb98](https://github.com/blemoine/ts-remove-any/commit/edfbb98cf5586b954758a92fcb627df48ed9416d))
* type aliasing for intersection ([242d390](https://github.com/blemoine/ts-remove-any/commit/242d390b1fac922be40d80e16a15ef54a23925f5))
* unit test ([b91dbcf](https://github.com/blemoine/ts-remove-any/commit/b91dbcf77e2fbe4a913795d9861a8a11905be3e0))

### [0.1.47](https://github.com/blemoine/ts-remove-any/compare/v0.1.46...v0.1.47) (2023-03-23)


### Features

* add support for tuples ([6fb9fed](https://github.com/blemoine/ts-remove-any/commit/6fb9fedc3954f9a2e945504cc1c297954652e03f))


### Bug Fixes

* fix support for function ([4371976](https://github.com/blemoine/ts-remove-any/commit/437197649268d84e050a246d6ffdc2d297175e86))
* put back the setType ([514eaf3](https://github.com/blemoine/ts-remove-any/commit/514eaf30523aec1a31559ce9c6521a1594e1ddf9))

### [0.1.46](https://github.com/blemoine/ts-remove-any/compare/v0.1.45...v0.1.46) (2023-03-22)


### Features

* remove catch clause computation ([a413699](https://github.com/blemoine/ts-remove-any/commit/a413699f7666f8563c0ada968c6fc44ccb6ba277))

### [0.1.45](https://github.com/blemoine/ts-remove-any/compare/v0.1.44...v0.1.45) (2023-03-21)


### Features

* add a test for union type ([f8eff80](https://github.com/blemoine/ts-remove-any/commit/f8eff8060374b322a1c3f622f592f6a60c865dbd))
* flatten union type ([ab11a6f](https://github.com/blemoine/ts-remove-any/commit/ab11a6f2389323c831a681118f706dba09a64143))

### [0.1.44](https://github.com/blemoine/ts-remove-any/compare/v0.1.43...v0.1.44) (2023-03-18)


### Features

* add support for explicit any ([2f5bb93](https://github.com/blemoine/ts-remove-any/commit/2f5bb930089863e1551f8ddacee8775349e64883))

### [0.1.43](https://github.com/blemoine/ts-remove-any/compare/v0.1.42...v0.1.43) (2023-03-18)


### Features

* add support for arithmetic operators ([9a79727](https://github.com/blemoine/ts-remove-any/commit/9a79727ddd03b8391b400a4ea9e971a1d1683369))
* add support for JSX usage computation ([35eb8e0](https://github.com/blemoine/ts-remove-any/commit/35eb8e0b45f93f22b4b0bc828fb7c3bc90807af5))
* add support for type parameter ([855b3bf](https://github.com/blemoine/ts-remove-any/commit/855b3bf49aa5a3baf7f92926b7f624d51a6150d9))
* add support for unary operations ([9ba935d](https://github.com/blemoine/ts-remove-any/commit/9ba935da3d90f2a7ca7138ec5b15297a1639ecfd))
* intermediate commit for Fake-type ([f23eeb3](https://github.com/blemoine/ts-remove-any/commit/f23eeb397872d21153bcaa30e862b3d3852ac185))
* support for union types in callable unifier ([6b3f020](https://github.com/blemoine/ts-remove-any/commit/6b3f02026a4a82c17c20cb33b26adad7c94d903b))
* use callable unifier for type alias ([f12e902](https://github.com/blemoine/ts-remove-any/commit/f12e9025fb39a47720f403dcd3ffb794dbbd1711))


### Bug Fixes

* find correctly the type of 2nd param in function ([3276c1d](https://github.com/blemoine/ts-remove-any/commit/3276c1d38aaebd680568da831112c1aa4cec5ffe))

### [0.1.42](https://github.com/blemoine/ts-remove-any/compare/v0.1.41...v0.1.42) (2023-03-12)


### Features

* add a callable unifier ([2706dbc](https://github.com/blemoine/ts-remove-any/commit/2706dbcebdd6b2ce4f6ae90f66e3c7706b1dae22))
* add some basic support for JSX call ([1ab15c5](https://github.com/blemoine/ts-remove-any/commit/1ab15c5ccf652b0d3156b9952be4ea609e0e9459))
* add support for any in interfaces ([94b1aa0](https://github.com/blemoine/ts-remove-any/commit/94b1aa0159cf8af2ebeb610ff67777a0eeeee7e5))
* add support for anyArray for let ([222ea50](https://github.com/blemoine/ts-remove-any/commit/222ea503690b2c84757d9060aa6e0321a1142b1b))
* add support for beta conversion ([bff2226](https://github.com/blemoine/ts-remove-any/commit/bff22268057e09ba4ba8de7cd004ed3bd7070175))
* add support for constructor in unifier ([4c32695](https://github.com/blemoine/ts-remove-any/commit/4c32695013c64e3c53baa214363dce459ce0313d))
* add support for method ([0bb98ab](https://github.com/blemoine/ts-remove-any/commit/0bb98ab6c9e33ab3c5272b59f9e3cbc806d07a20))
* add support for never[] ([687460c](https://github.com/blemoine/ts-remove-any/commit/687460cfc04795a0e0e2fee08ac41dbac9d9f0ff))
* add support for nullable ([f0bd309](https://github.com/blemoine/ts-remove-any/commit/f0bd309c4bee74962ac82a5c9f5707edf648a7b9))
* add support for some JSX ([bc453ef](https://github.com/blemoine/ts-remove-any/commit/bc453ef09b49bb7bc578f47f2c084e153d561630))
* add support for spread props ([a7b04a2](https://github.com/blemoine/ts-remove-any/commit/a7b04a2f9351e8973ee9773b85b707c56169560d))
* add support for type declaration ([5384497](https://github.com/blemoine/ts-remove-any/commit/5384497f893b66f1612ef24a1b11a00fe2b907b5))
* add support for unknown ([4bdea9b](https://github.com/blemoine/ts-remove-any/commit/4bdea9b04dacc1967fb4ffe8a653eef459c105ff))
* add support for variables for types ([57755c4](https://github.com/blemoine/ts-remove-any/commit/57755c454461d0924c605fa36e9adcb7b5d4b7a1))
* add support function in types ([ce4b3d2](https://github.com/blemoine/ts-remove-any/commit/ce4b3d2381296420c02f7e9e788da2d3d4c5d98f))
* add types from lambda ([ad50044](https://github.com/blemoine/ts-remove-any/commit/ad500445ba736101b3d0251a33b9090ce2d05e07))
* add unifier for beta reduction ([4fc9544](https://github.com/blemoine/ts-remove-any/commit/4fc9544c94db389638cbda177e8bb3616df45b38))
* ensure recursive access to dotted property ([ec6b05f](https://github.com/blemoine/ts-remove-any/commit/ec6b05f44c257d957161706eea0700aa690dbdea))
* factorize type unifier ([6e18808](https://github.com/blemoine/ts-remove-any/commit/6e18808e50d8548f601ab4488daa2d2b6430aa83))
* filter some more any ([ec5b357](https://github.com/blemoine/ts-remove-any/commit/ec5b357a3bea7b2eb17288278663a65401c8edf0))
* find type in JSX expression ([f1fc797](https://github.com/blemoine/ts-remove-any/commit/f1fc797cdaa15fd5a3b09afbee0d338aeea176cb))
* recurse through object type ([0213922](https://github.com/blemoine/ts-remove-any/commit/0213922db97dd2cd4cbf1582219ccdbcd1ca2cdd))
* simplify doc ([545d7d6](https://github.com/blemoine/ts-remove-any/commit/545d7d68f7974c633c007beec0cdb27e01ddc7f8))
* use callables for call to Constructor ([34638a7](https://github.com/blemoine/ts-remove-any/commit/34638a7e90345c9ff1ededb83b73dea2a64abdf4))


### Bug Fixes

* add support for no reverts ([90d5db3](https://github.com/blemoine/ts-remove-any/commit/90d5db3eb879ed89433bba38f63fb7c01e88ad73))
* callable unifier ([e387c9b](https://github.com/blemoine/ts-remove-any/commit/e387c9b8a455817ef2a3329aec8136ba3ad5b719))
* filter breaking types ([e6b78b3](https://github.com/blemoine/ts-remove-any/commit/e6b78b39258413b123e7d81f349d9222033dbc88))
* fix some corner failing corner case ([87ca7ed](https://github.com/blemoine/ts-remove-any/commit/87ca7eda25df5a570de9e9503dc888a6d1053b39))

### [0.1.41](https://github.com/blemoine/ts-remove-any/compare/v0.1.40...v0.1.41) (2023-03-06)


### Features

* add a type unifier test case ([49078f2](https://github.com/blemoine/ts-remove-any/commit/49078f28dfb4d9929937cc5967d18cbf35f99bb8))
* add support for classes constructor ([f3067ed](https://github.com/blemoine/ts-remove-any/commit/f3067edfcca22ebaea0476317ec2dd4aeea27bf2))
* add support for method call ([72e9cb1](https://github.com/blemoine/ts-remove-any/commit/72e9cb16b8d0c670f66ce199ea09d42fdc70f9e4))
* add support for object determination ([37f6dd1](https://github.com/blemoine/ts-remove-any/commit/37f6dd15543a07f8edb1b623563754e012cbc5ca))
* add support for return statement in unifier ([6aba6d6](https://github.com/blemoine/ts-remove-any/commit/6aba6d64476d9182546ed859920bdb42004315b6))
* add support for simple variable declaration ([9db53aa](https://github.com/blemoine/ts-remove-any/commit/9db53aa2a033f2c5958d26a820ee977132d2d5ff))
* init type-unifier ([fa4d185](https://github.com/blemoine/ts-remove-any/commit/fa4d185d5233be86aa46f543b12e88dbb3b7ffca))
* support for returns type for function ([b099372](https://github.com/blemoine/ts-remove-any/commit/b099372bd146fee8ea02fbf0ddd85fc0bea5fd6f))
* use allTypesOfRef ([6bfcc69](https://github.com/blemoine/ts-remove-any/commit/6bfcc698b0a9fbc8f2b6b937e9c16fd65ec462a9))

### [0.1.40](https://github.com/blemoine/ts-remove-any/compare/v0.1.39...v0.1.40) (2023-03-05)


### Features

* try to apply patckage on the fly ([44f70b6](https://github.com/blemoine/ts-remove-any/commit/44f70b6edf5f1b1039ab2089c93c9f906b146f74))

### [0.1.39](https://github.com/blemoine/ts-remove-any/compare/v0.1.38...v0.1.39) (2023-03-04)


### Features

* remove an exagerated case ([8002cb6](https://github.com/blemoine/ts-remove-any/commit/8002cb6aad307397b2539be3756273240ac24a72))

### [0.1.38](https://github.com/blemoine/ts-remove-any/compare/v0.1.37...v0.1.38) (2023-03-04)


### Features

* add countOfAnys ([e957293](https://github.com/blemoine/ts-remove-any/commit/e957293c4199d52de3decb88947391d189898dcd))
* add support for arrows for React Component ([1e85180](https://github.com/blemoine/ts-remove-any/commit/1e85180291e948d3dc8a40a36576594731b09e0c))
* try to filter files with no any ([83af2af](https://github.com/blemoine/ts-remove-any/commit/83af2af56aeb4935645a860d8fbd8d30ded65e12))
* trying to optimize the run ([845aa08](https://github.com/blemoine/ts-remove-any/commit/845aa083660d2977c9967e687a2388ca387bc5cf))

### [0.1.37](https://github.com/blemoine/ts-remove-any/compare/v0.1.36...v0.1.37) (2023-03-03)


### Features

* add support for arrow functions ([46244a5](https://github.com/blemoine/ts-remove-any/commit/46244a579e8089582cde9d0b79e50ce75420c047))


### Bug Fixes

* filter files only once ([4953038](https://github.com/blemoine/ts-remove-any/commit/4953038b6b2e3a485a84418d3bc356f74dbe410b))

### [0.1.36](https://github.com/blemoine/ts-remove-any/compare/v0.1.35...v0.1.36) (2023-03-02)


### Features

* filter out never ([90b7a37](https://github.com/blemoine/ts-remove-any/commit/90b7a3757c2d6e190e9837cd55f6e42580592303))
* support for inner function/and variable ([a08ca47](https://github.com/blemoine/ts-remove-any/commit/a08ca4773e718be0fd05590970f66a3f6ef93b36))

### [0.1.35](https://github.com/blemoine/ts-remove-any/compare/v0.1.34...v0.1.35) (2023-03-02)


### Features

* add error log ([5fe212b](https://github.com/blemoine/ts-remove-any/commit/5fe212b920aa435fe17ad9b223ee48f95a0de631))


### Bug Fixes

* remove useless code ([20bb7ea](https://github.com/blemoine/ts-remove-any/commit/20bb7ea0ea86c3e25616a2e670e1ffb0a621828a))

### [0.1.34](https://github.com/blemoine/ts-remove-any/compare/v0.1.33...v0.1.34) (2023-03-02)


### Features

* add support for React Props ([bd668b5](https://github.com/blemoine/ts-remove-any/commit/bd668b51af4e2b9a18c5c5c891c5e0ccf5191e78))

### [0.1.33](https://github.com/blemoine/ts-remove-any/compare/v0.1.32...v0.1.33) (2023-03-01)


### Features

* add correct support for method usage ([e4f9f30](https://github.com/blemoine/ts-remove-any/commit/e4f9f308647c871414f12549977287cff305e6f1))
* introduce commander ([c36c12a](https://github.com/blemoine/ts-remove-any/commit/c36c12aa149c2640aa824695e48db7b8e82dd61e))

### [0.1.32](https://github.com/blemoine/ts-remove-any/compare/v0.1.31...v0.1.32) (2023-03-01)


### Bug Fixes

* filter invalid value for function computation ([039c514](https://github.com/blemoine/ts-remove-any/commit/039c5148eaab5a257d1d2d63704cc2b93ee14665))

### [0.1.31](https://github.com/blemoine/ts-remove-any/compare/v0.1.30...v0.1.31) (2023-03-01)


### Features

* deduce type from usage ([34b05a6](https://github.com/blemoine/ts-remove-any/commit/34b05a6e367c23fdfb7c70186ba559a79e432b03))

### [0.1.30](https://github.com/blemoine/ts-remove-any/compare/v0.1.29...v0.1.30) (2023-03-01)


### Features

* try to generate function any from usage in declaration ([9f0de7b](https://github.com/blemoine/ts-remove-any/commit/9f0de7b9b9291ed8ce8ba9c0728921320f933fd2))

### [0.1.29](https://github.com/blemoine/ts-remove-any/compare/v0.1.28...v0.1.29) (2023-02-28)


### Features

* add initial support for call site mapping ([1ed5477](https://github.com/blemoine/ts-remove-any/commit/1ed5477943557859f99416afcaa7a277923ff166))
* add support for call parameters ([2dd6ee5](https://github.com/blemoine/ts-remove-any/commit/2dd6ee5b35939b6574ec355017f9082928a2e103))

### [0.1.28](https://github.com/blemoine/ts-remove-any/compare/v0.1.27...v0.1.28) (2023-02-27)


### Features

* support for beta reduction call site ([0a67ca6](https://github.com/blemoine/ts-remove-any/commit/0a67ca6d2047db70b6d6bd4b84632692f39901bb))

### [0.1.27](https://github.com/blemoine/ts-remove-any/compare/v0.1.26...v0.1.27) (2023-02-27)


### Bug Fixes

* load conf from local tsconfig ([a0dd017](https://github.com/blemoine/ts-remove-any/commit/a0dd017272bcfa1aec42f593d561eeddb4047825))

### [0.1.26](https://github.com/blemoine/ts-remove-any/compare/v0.1.25...v0.1.26) (2023-02-27)


### Features

* add `r` as a short option to deactivate revertable changes ([9ce15d6](https://github.com/blemoine/ts-remove-any/commit/9ce15d634b2eb83d52985e3813a3b6e613edf043))
* add verbose option ([776182c](https://github.com/blemoine/ts-remove-any/commit/776182c33d5364a5e2409729d3810e91409db0df))

### [0.1.25](https://github.com/blemoine/ts-remove-any/compare/v0.1.24...v0.1.25) (2023-02-27)


### Features

* add some options (-f -r) ([f7877e3](https://github.com/blemoine/ts-remove-any/commit/f7877e3975a1572786224c5e7ee1ef8050cdd5c2))
* more precise revert log ([68b418e](https://github.com/blemoine/ts-remove-any/commit/68b418ec0cdb1599254e0b35632eac0f4476256d))

### [0.1.24](https://github.com/blemoine/ts-remove-any/compare/v0.1.23...v0.1.24) (2023-02-27)


### Features

* remove typeof filtering ([58fd57d](https://github.com/blemoine/ts-remove-any/commit/58fd57d7a18759dce0dcea4f595d093ed28998ed))

### [0.1.23](https://github.com/blemoine/ts-remove-any/compare/v0.1.22...v0.1.23) (2023-02-27)


### Features

* filter out `any` ([0c3fa87](https://github.com/blemoine/ts-remove-any/commit/0c3fa87769ecd1f6f8e748f21528a6e34defcbe6))

### [0.1.22](https://github.com/blemoine/ts-remove-any/compare/v0.1.21...v0.1.22) (2023-02-27)


### Bug Fixes

* compare pre and post for diagnostic ([f218bfb](https://github.com/blemoine/ts-remove-any/commit/f218bfb1bc15b801f13cc4c8ba4ffb5ce9f1dd44))

### [0.1.21](https://github.com/blemoine/ts-remove-any/compare/v0.1.20...v0.1.21) (2023-02-27)

### [0.1.20](https://github.com/blemoine/ts-remove-any/compare/v0.1.19...v0.1.20) (2023-02-27)


### Features

* revert let that won't compile ([1698734](https://github.com/blemoine/ts-remove-any/commit/1698734ee54eb5494c67903b08afdfa34d639c91))
* revert non compiling transformation ([5e2c208](https://github.com/blemoine/ts-remove-any/commit/5e2c2085a39e07bac72a3827ea37f43bb39db067))

### [0.1.19](https://github.com/blemoine/ts-remove-any/compare/v0.1.18...v0.1.19) (2023-02-26)


### Features

* filter imports/any for let ([32e353e](https://github.com/blemoine/ts-remove-any/commit/32e353e9f7ef3239b8c475c760826ab35925fa9b))

### [0.1.18](https://github.com/blemoine/ts-remove-any/compare/v0.1.17...v0.1.18) (2023-02-26)


### Features

* improve logging ([1e934df](https://github.com/blemoine/ts-remove-any/commit/1e934df162f3d317a186a243e91762d81ee8c6fe))

### [0.1.17](https://github.com/blemoine/ts-remove-any/compare/v0.1.16...v0.1.17) (2023-02-26)


### Features

* add support for let rewrite ([9e94d70](https://github.com/blemoine/ts-remove-any/commit/9e94d706067d10bf7e98fbd36996451d48deb35b))

### [0.1.16](https://github.com/blemoine/ts-remove-any/compare/v0.1.15...v0.1.16) (2023-02-26)


### Features

* factorize literal and super type ([316a8ae](https://github.com/blemoine/ts-remove-any/commit/316a8aeeca6111ee527a7cdf826f68b468f7061b))

### [0.1.15](https://github.com/blemoine/ts-remove-any/compare/v0.1.14...v0.1.15) (2023-02-26)


### Features

* loop to remove successive any ([28a077f](https://github.com/blemoine/ts-remove-any/commit/28a077fe456d9dfa88f5cb0bc48f3e6253eb4ddd))
* track the number of file done ([ea6b267](https://github.com/blemoine/ts-remove-any/commit/ea6b267267f090f6ff7608b7de97fd7f30c8c099))

### [0.1.14](https://github.com/blemoine/ts-remove-any/compare/v0.1.13...v0.1.14) (2023-02-26)


### Features

* remove typeof types ([8fa07df](https://github.com/blemoine/ts-remove-any/commit/8fa07df83410a6a56f5e85c049ac958d2ac9892b))

### [0.1.13](https://github.com/blemoine/ts-remove-any/compare/v0.1.12...v0.1.13) (2023-02-26)


### Features

* filter imports and any[] ([359b92a](https://github.com/blemoine/ts-remove-any/commit/359b92ac2f64efd818a2d81dfddcd8d076a35f1c))

### [0.1.12](https://github.com/blemoine/ts-remove-any/compare/v0.1.11...v0.1.12) (2023-02-26)


### Features

* don't generate any or duplicates ([63d4d31](https://github.com/blemoine/ts-remove-any/commit/63d4d313b8ef699ba03113157403044ebfd39df2))

### [0.1.11](https://github.com/blemoine/ts-remove-any/compare/v0.1.10...v0.1.11) (2023-02-26)


### Bug Fixes

* argument may be undefined ([efa830a](https://github.com/blemoine/ts-remove-any/commit/efa830a3d7e4177c1e8d2aed3159c9b9d6e4345a))

### [0.1.10](https://github.com/blemoine/ts-remove-any/compare/v0.1.9...v0.1.10) (2023-02-26)


### Features

* ignore JS file ([d47eb6a](https://github.com/blemoine/ts-remove-any/commit/d47eb6a86c15d833d69b8bcf2ba0b209e997c3c3))

### [0.1.9](https://github.com/blemoine/ts-remove-any/compare/v0.1.8...v0.1.9) (2023-02-26)


### Features

* read from tsconfig and persist changes ([2a67fb7](https://github.com/blemoine/ts-remove-any/commit/2a67fb7fe36c0339870c4838b60bc7cc8d8eada8))

### [0.1.8](https://github.com/blemoine/ts-remove-any/compare/v0.1.7...v0.1.8) (2023-02-25)


### Bug Fixes

* add missing quote to executable ([184a1b9](https://github.com/blemoine/ts-remove-any/commit/184a1b9cb7910f7701a3c3c8e841d659d23eec32))

### [0.1.7](https://github.com/blemoine/ts-remove-any/compare/v0.1.6...v0.1.7) (2023-02-25)


### Features

* add a release script ([08c66c5](https://github.com/blemoine/ts-remove-any/commit/08c66c5706f7d85f8584a44b5ff6226b8e7956e5))


### Bug Fixes

* another try to fix executable ([eb758c9](https://github.com/blemoine/ts-remove-any/commit/eb758c96aeb672b64542f4f94c387b4dd1f37a77))

### [0.1.6](https://github.com/blemoine/ts-remove-any/compare/v0.1.5...v0.1.6) (2023-02-25)


### Bug Fixes

* try another solution to have an executable ([d983bac](https://github.com/blemoine/ts-remove-any/commit/d983bac0f1675341d957b42c50b6015c2e65a969))

### [0.1.5](https://github.com/blemoine/ts-remove-any/compare/v0.1.4...v0.1.5) (2023-02-25)


### Bug Fixes

* add executable directive in package.json ([fdecff8](https://github.com/blemoine/ts-remove-any/commit/fdecff8a0cfecdd476f8bdc36aa73fad3a154645))

### [0.1.4](https://github.com/blemoine/ts-remove-any/compare/v0.1.3...v0.1.4) (2023-02-25)


### Bug Fixes

* fix release version push ([ba25913](https://github.com/blemoine/ts-remove-any/commit/ba259137f86b3ac64bd468a24346a7401388d974))

### [0.1.3](https://github.com/blemoine/ts-remove-any/compare/v0.1.2...v0.1.3) (2023-02-25)


### Features

* try supporting cli ([abeb912](https://github.com/blemoine/ts-remove-any/commit/abeb912faa3839617e3cac936ba1fd84660ba118))

### [0.1.2](https://github.com/blemoine/ts-remove-any/compare/v0.1.1...v0.1.2) (2023-02-25)

### 0.1.1 (2023-02-25)


### Features

* add suppoort for transitive type ([a1e2173](https://github.com/blemoine/ts-remove-any/commit/a1e21735ba3e4ab5e659f1c228d00fe81875f9cc))
* add support for string ([a80b64e](https://github.com/blemoine/ts-remove-any/commit/a80b64e3d6f4cb56ef76cd160c444ecfe0757e9c))
* init properly the project ([5493919](https://github.com/blemoine/ts-remove-any/commit/5493919068ffe8c0191572bd825c0a500420e8d5))
* init release process ([dfa49d1](https://github.com/blemoine/ts-remove-any/commit/dfa49d1c709c537daa4f53a8611c6f82957cad69))
