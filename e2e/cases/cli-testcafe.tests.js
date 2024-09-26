import { existsSync } from 'node:fs';
import { join } from 'node:path';

import sizeOf from 'image-size';
import { rimrafSync } from 'rimraf';

import {
  getBaseUrl, fixedSize, fixedFile, callTC,
} from '../lib';

fixture('Testing cli testcafe --take-snapshot').page(getBaseUrl());

test('should care arg without name', async t => {
  const basePath = join('e2e', 'screens', 'Testing_cli', 'assert__it');
  rimrafSync(basePath);

  await callTC('e2e/file/cases/takesnapshot.test.js', ['--take-snapshot', 'base', '-t', 'takesnapshot']);

  await t.expect(existsSync(join(basePath, fixedFile('base.png')))).ok();
});

test('should care arg with name', async t => {
  const basePath = join('e2e', 'screens', 'Testing_cli', 'assert__it');
  rimrafSync(basePath);

  const fpath = 'e2e/file/cases/takesnapshot.test.js';
  await callTC(fpath, ['--take-snapshot', 'base', '-t', 'takesnapshot']);
  await callTC(fpath, ['--take-snapshot', 'actual', '-t', 'takesnapshot']);
  await callTC(fpath, ['--take-snapshot', 'foo', '-t', 'takesnapshot']);

  await t.expect(existsSync(join(basePath, fixedFile('base.png')))).ok();
  await t.expect(existsSync(join(basePath, fixedFile('actual.png')))).ok();
  await t.expect(existsSync(join(basePath, fixedFile('foo.png')))).ok();
  await t.expect(existsSync(join(basePath, fixedFile('bar.png')))).notOk();
});

fixture('Testing cli testcafe --full-page').page(getBaseUrl());

test('should care arg', async t => {
  const basePath = join('e2e', 'screens', 'Testing_cli');
  rimrafSync(basePath);

  const fpath = 'e2e/file/cases/takesnapshot.test.js';
  await callTC(fpath, ['--take-snapshot', '--full-page', '-t', 'fullpage']);
  await callTC(fpath, ['--take-snapshot', '-t', 'nofullpage']);

  const pngFull = sizeOf(join(basePath, 'assert__it__with__fullpage', fixedFile('base.png')));
  await t.expect(pngFull.width).eql(fixedSize(1290));
  await t.expect(pngFull.height).gte(fixedSize(1356));

  const pngNoFull = sizeOf(join(basePath, 'assert__it__without__fullpage', fixedFile('base.png')));
  await t.expect(pngNoFull.width).gte(fixedSize(623));
  await t.expect(pngNoFull.width).lte(fixedSize(640));
  await t.expect(pngNoFull.height).gte(fixedSize(463));
  await t.expect(pngNoFull.height).lte(fixedSize(480));
});
