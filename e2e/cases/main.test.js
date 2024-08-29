import { Selector } from 'testcafe';
import { takeSnapshot } from '../../lib';

fixture('Testing')
.page(`${process.env.BASE_URL}/`);

test('should render "It works!"', async t => {
  process.env.TAKE_SNAPSHOT = "1";

  await t.wait(1000);
  await takeSnapshot(t, 'before_assert_it_works');

  await t
    .expect(Selector('h1').exists).ok()
    .expect(Selector('h1').visible).ok()
    .expect(Selector('h1').innerText).contains('It works!');

  await takeSnapshot(t, 'after_assert_it_works');
});

fixture('Testing fullPage')
.page(`${process.env.BASE_URL}/`);

test('should render "It works!"', async t => {
  process.env.TAKE_SNAPSHOT = "1";

  await t.wait(1000);
  await takeSnapshot(t, { label: 'before_assert_fullpage', fullPage: true });

  await t
    .expect(Selector('h1').exists).ok()
    .expect(Selector('h1').visible).ok()
    .expect(Selector('h1').innerText).contains('It works!');

  await takeSnapshot(t, { label: 'after_assert_fullpage', fullPage: true });
});

fixture('Testing blockOut')
.page(`${process.env.BASE_URL}/`);

test('should render "It works!"', async t => {
  process.env.TAKE_SNAPSHOT = "1";

  await t.wait(1000);

  const elements = [
    Selector('.animated'),
  ];

  await takeSnapshot(t, { label: 'before_assert_blockout', blockOut: elements, fullPage: true });

  await t
    .expect(Selector('h1').exists).ok()
    .expect(Selector('h1').visible).ok()
    .expect(Selector('h1').innerText).contains('It works!');

  await takeSnapshot(t, { label: 'after_assert_blockout', blockOut: elements, fullPage: true });
});
