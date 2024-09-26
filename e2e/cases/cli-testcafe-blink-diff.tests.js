import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { rimrafSync } from 'rimraf';

import {
  getBaseUrl, fixedFile, callTBD,
} from '../lib';

fixture('Testing cli testcafe-blink-diff').page(getBaseUrl());

test('do compare', async t => {
  rimrafSync(join('e2e', 'generated-with'));

  await callTBD([
    'e2e/file/screens/Testing_cli_testcafe-blink-diff_with',
    'e2e/generated-with',
    '--compare',
    'base:actual',
    '--threshold',
    '1.00',
  ]);

  await t
    .expect(existsSync(join('e2e', 'generated-with', 'index.html')))
    .ok();
  await t
    .expect(existsSync(join('e2e', 'generated-with', 'expects', fixedFile('out.png'))))
    .ok();
});

test('create thumbnails when not exists', async t => {
  rimrafSync(join('e2e', 'generated-without'));

  await callTBD([
    'e2e/file/screens/Testing_cli_testcafe-blink-diff_without',
    'e2e/generated-without',
    '--compare',
    'base:actual',
    '--threshold',
    '1.00',
  ]);

  await t
    .expect(existsSync(join('e2e', 'generated-without', 'expects', 'thumbnails', fixedFile('base.png'))))
    .ok();
  await t
    .expect(existsSync(join('e2e', 'generated-without', 'expects', 'thumbnails', fixedFile('actual.png'))))
    .ok();
});
