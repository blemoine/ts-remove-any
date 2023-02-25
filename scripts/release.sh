#!/bin/sh

git fetch
git checkout main
git reset --hard HEAD
npm run release
npm publish