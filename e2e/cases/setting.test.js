import { existsSync } from 'node:fs';
const { join } = require('node:path');

import sizeOf from 'image-size';
import { rimrafSync } from 'rimraf';

import { takeSnapshot } from '../../lib';

fixture('Testing set FULL_PAGE')
.page(`${process.env.BASE_URL}/`);

test('should care environment variables', async t => {
  process.env.TAKE_SNAPSHOT = "1";

  const basePath = join('e2e', 'screens', 'Testing_set_FULL__PAGE');
  rimrafSync(basePath);

  process.env.FULL_PAGE = "1";
  await t.resizeWindow(640, 480);
  await takeSnapshot(t, 'after_set_env');

  delete process.env.FULL_PAGE;
  await takeSnapshot(t, 'after_del_env');

  const pngWithEnv = sizeOf(join(basePath, 'after__set__env', 'base.png'));
  await t.expect(pngWithEnv.width).eql(1290);
  await t.expect(pngWithEnv.height).eql(1367);

  const pngWithOutEnv = sizeOf(join(basePath, 'after__del__env', 'base.png'));
  await t.expect(pngWithOutEnv.width).eql(625);
  await t.expect(pngWithOutEnv.height).eql(465);
});

fixture('Testing set TAKE_SNAPSHOT')
.page(`${process.env.BASE_URL}/`);

test('should care environment variables', async t => {
  const basePath = join('e2e', 'screens', 'Testing_set_TAKE__SNAPSHOT');
  rimrafSync(basePath);

  await t.wait(1000);

  process.env.TAKE_SNAPSHOT = "1";
  await takeSnapshot(t, 'after_set_env');

  delete process.env.TAKE_SNAPSHOT
  await takeSnapshot(t, 'after_del_env');

  await t.expect(existsSync(join(basePath, 'after__set__env', 'base.png'))).ok();
  await t.expect(existsSync(join(basePath, 'after__del__env', 'base.png'))).notOk();
});

fixture('Testing set SNAPSHOT_NAME')
.page(`${process.env.BASE_URL}/`);

test('should care environment variables', async t => {
  process.env.TAKE_SNAPSHOT = "1";

  const basePath = join('e2e', 'screens', 'Testing_set_SNAPSHOT__NAME');
  rimrafSync(basePath);

  await t.wait(1000);

  process.env.SNAPSHOT_NAME = "base";
  await takeSnapshot(t, 'after_set_env_base');

  process.env.SNAPSHOT_NAME = "actual";
  await takeSnapshot(t, 'after_set_env_actual');

  process.env.SNAPSHOT_NAME = "foo";
  await takeSnapshot(t, 'after_set_env_foo');


  await t.expect(existsSync(join(basePath, 'after__set__env__base', 'base.png'))).ok();
  await t.expect(existsSync(join(basePath, 'after__set__env__actual', 'actual.png'))).ok();
  await t.expect(existsSync(join(basePath, 'after__set__env__foo', 'foo.png'))).ok();
});
