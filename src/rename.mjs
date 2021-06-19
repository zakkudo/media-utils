#!/usr/bin/env node

import console from "console";
import fs from "fs";
import path from "path";

const [, , pattern, newSubstr, write] = process.argv;
const cwd = process.cwd();
const filenames = [];
let next = fs.readdirSync(cwd, { withFileTypes: true }).map((f) => ({
  name: path.resolve(".", f.name),
  directory: f.isDirectory(),
}));

console.log('INPUT: ', { pattern, newSubstr });

while (next.length) {
  next = next.reduce((accumulator, file) => {
    filenames.push(file.name);

    if (file.directory) {
      const directoryFiles = fs
        .readdirSync(file.name, {
          withFileTypes: true,
        })
        .map((f) => ({
          name: path.join(file.name, f.name),
          directory: f.isDirectory(),
        }));

      return accumulator.concat(directoryFiles);
    }

    return accumulator;
  }, []);
}

filenames.sort();

const renameMapping = [];

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_a_parameter
filenames.forEach((f) => {
  const regexp = new RegExp(pattern);
  const dirname = path.dirname(f);
  const basename = path.basename(f);

  if (basename.match(regexp)) {
    const start = path.relative(cwd, f);
    const end = path.relative(cwd, path.join(dirname, basename.replace(regexp, newSubstr)));
    renameMapping.push({ start, end });
  }
});

if (write == '--write') {
  renameMapping.reverse().forEach(({ start, end }) => {
    console.log('mv `'+start+'` `'+end+'`');
    fs.renameSync(start, end);
  });
} else {
  renameMapping.reverse().forEach(({ start, end }) => {
    console.log('DRY RUN');
    console.log('mv `'+start+'` `'+end+'`');
  });
}
