import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { rimrafSync } from 'rimraf';

import {
  getBaseUrl, fixedFile, callTBD,
} from '../lib';

fixture('Testing cli testcafe-blink-diff').page(getBaseUrl());

test('do compare', async t => {
  const dstName = 'generated-with';
  rimrafSync(join('e2e', dstName));

  await callTBD([
    'e2e/file/screens/Testing_cli_testcafe-blink-diff_with',
    `e2e/${dstName}`,
  ]);

  const parent = join('e2e', dstName);
  await t.expect(existsSync(join(parent, 'index.html'))).ok();
  await t.expect(existsSync(join(parent, 'expects', fixedFile('out.png')))).ok();

  rimrafSync(join('e2e', dstName));
});

test('create thumbnails when not exists', async t => {
  const dstName = 'generated-without';
  rimrafSync(join('e2e', dstName));

  await callTBD([
    'e2e/file/screens/Testing_cli_testcafe-blink-diff_without',
    `e2e/${dstName}`,
  ]);

  const parent = join('e2e', dstName, 'expects', 'thumbnails');
  await t.expect(existsSync(join(parent, fixedFile('base.png')))).ok();
  await t.expect(existsSync(join(parent, fixedFile('actual.png')))).ok();

  rimrafSync(join('e2e', dstName));
});

// eslint-disable-next-line no-restricted-syntax
for (const arg of ['-y', '--only']) {
  test(`arg only ${arg}`, async t => {
    const dstName = 'generated-only';
    rimrafSync(join('e2e', dstName));

    await callTBD([
      'e2e/file/screens/Testing_cli_testcafe-blink-diff_only',
      `e2e/${dstName}`,
      arg,
      'base.png',
      arg,
      'actual.png',
    ]);

    const parent = join('e2e', dstName, 'expects');
    await t.expect(existsSync(join(parent, fixedFile('base.png')))).ok();
    await t.expect(existsSync(join(parent, fixedFile('actual.png')))).ok();

    rimrafSync(join('e2e', dstName));
  });
}

// eslint-disable-next-line no-restricted-syntax
for (const arg of ['-f', '--force']) {
  test(`arg force ${arg}`, async t => {
    const dstName = 'generated-force';
    rimrafSync(join('e2e', dstName));

    await callTBD([
      'e2e/file/screens/Testing_cli_testcafe-blink-diff_force',
      `e2e/${dstName}`,
      '-c',
      'src:dst',
      arg,
    ]);

    const parent = join('e2e', dstName, 'file2');
    await t.expect(existsSync(join(parent, fixedFile('src.png')))).ok();
    await t.expect(existsSync(join(parent, fixedFile('dst.png')))).ok();
    rimrafSync(join('e2e', dstName));
  });
}

// eslint-disable-next-line no-restricted-syntax
for (const arg of ['-x', '--filter']) {
  test(`arg filter ${arg}`, async t => {
    const dstName = 'generated-filter';
    rimrafSync(join('e2e', dstName));

    await callTBD([
      'e2e/file/screens/Testing_cli_testcafe-blink-diff_filter',
      `e2e/${dstName}`,
      arg,
      'file1',
    ]);

    const parent = join('e2e', dstName);
    await t.expect(existsSync(join(parent, 'file0', fixedFile('base.png')))).notOk();
    await t.expect(existsSync(join(parent, 'file1', fixedFile('base.png')))).ok();

    rimrafSync(join('e2e', dstName));
  });
}

// eslint-disable-next-line no-restricted-syntax
for (const arg of ['-c', '--compare']) {
  test(`arg compare ${arg}`, async t => {
    const dstName = 'generated-custom-name';
    rimrafSync(join('e2e', dstName));

    await callTBD([
      'e2e/file/screens/Testing_cli_testcafe-blink-diff_custom_name',
      `e2e/${dstName}`,
      arg,
      'src:dst',
    ]);

    const parent = join('e2e', dstName, 'expects');
    await t.expect(existsSync(join(parent, fixedFile('src.png')))).ok();
    await t.expect(existsSync(join(parent, fixedFile('dst.png')))).ok();
    await t.expect(existsSync(join(parent, 'thumbnails', fixedFile('src.png')))).ok();
    await t.expect(existsSync(join(parent, 'thumbnails', fixedFile('dst.png')))).ok();

    rimrafSync(join('e2e', dstName));
  });
}
