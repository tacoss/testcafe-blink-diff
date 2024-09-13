import { existsSync } from 'node:fs';
import { join } from 'node:path';

import sizeOf from 'image-size';
import { rimrafSync } from 'rimraf';

import { getBaseUrl, fixedSize, fixedFile } from '../lib';
import { takeSnapshot } from '../../lib';

fixture('Testing set FULL_PAGE').page(getBaseUrl());

test('should care environment variables', async t => {
  process.env.TAKE_SNAPSHOT = '1';
  // XXX: set snapshot name to fix what without settings
  //      makes set to commandline's browser name
  process.env.SNAPSHOT_NAME = 'base';

  const basePath = join('e2e', 'screens', 'Testing_set_FULL__PAGE');
  rimrafSync(basePath);

  process.env.FULL_PAGE = '1';
  await t.resizeWindow(640, 480);
  await takeSnapshot(t, 'after_set_env');

  delete process.env.FULL_PAGE;
  await takeSnapshot(t, 'after_del_env');

  const pngWithEnv = sizeOf(join(basePath, 'after__set__env', fixedFile('base.png')));
  await t.expect(pngWithEnv.width).eql(fixedSize(1290));
  await t.expect(pngWithEnv.height).gte(fixedSize(1356));

  const pngWithOutEnv = sizeOf(join(basePath, 'after__del__env', fixedFile('base.png')));
  await t.expect(pngWithOutEnv.width).gte(fixedSize(623));
  await t.expect(pngWithOutEnv.width).lte(fixedSize(640));
  await t.expect(pngWithOutEnv.height).gte(fixedSize(463));
  await t.expect(pngWithOutEnv.height).lte(fixedSize(480));
});

fixture('Testing set TAKE_SNAPSHOT').page(getBaseUrl());

test('should care environment variables', async t => {
  // XXX: set snapshot name to fix what without settings
  //      makes set to commandline's browser name
  process.env.SNAPSHOT_NAME = 'base';

  const basePath = join('e2e', 'screens', 'Testing_set_TAKE__SNAPSHOT');
  rimrafSync(basePath);

  await t.wait(1000);

  process.env.TAKE_SNAPSHOT = '1';
  await takeSnapshot(t, 'after_set_env');

  delete process.env.TAKE_SNAPSHOT;
  await takeSnapshot(t, 'after_del_env');

  await t.expect(existsSync(join(basePath, 'after__set__env', fixedFile('base.png')))).ok();
  await t.expect(existsSync(join(basePath, 'after__del__env', fixedFile('base.png')))).notOk();
});

fixture('Testing set SNAPSHOT_NAME').page(getBaseUrl());

test('should care environment variables', async t => {
  process.env.TAKE_SNAPSHOT = '1';

  const basePath = join('e2e', 'screens', 'Testing_set_SNAPSHOT__NAME');
  rimrafSync(basePath);

  await t.wait(1000);

  process.env.SNAPSHOT_NAME = 'base';
  await takeSnapshot(t, 'after_set_env_base');

  process.env.SNAPSHOT_NAME = 'actual';
  await takeSnapshot(t, 'after_set_env_actual');

  process.env.SNAPSHOT_NAME = 'foo';
  await takeSnapshot(t, 'after_set_env_foo');

  await t.expect(existsSync(join(basePath, 'after__set__env__base', fixedFile('base.png')))).ok();
  await t.expect(existsSync(join(basePath, 'after__set__env__actual', fixedFile('actual.png')))).ok();
  await t.expect(existsSync(join(basePath, 'after__set__env__foo', fixedFile('foo.png')))).ok();
});
