import { getBaseUrl } from '../../lib';
import { takeSnapshot } from '../../../lib';

fixture('Testing cli').page(getBaseUrl());

test('takesnapshot', async t => {
  await takeSnapshot(t, 'assert_it');
});

test('fullpage', async t => {
  await t.resizeWindow(640, 480);
  await takeSnapshot(t, 'assert_it_with_fullpage');
});

test('nofullpage', async t => {
  await t.resizeWindow(640, 480);
  await takeSnapshot(t, 'assert_it_without_fullpage');
});
