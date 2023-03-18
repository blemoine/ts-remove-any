# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
