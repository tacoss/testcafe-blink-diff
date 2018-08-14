# How it works?

Install this dependency in your project, e.g. `npm i testcafe-blink-diff --save-dev`

Call the `snapshot()` helper within your tests, e.g.

```js
import { snapshot } from 'testcafe-blink-diff';

fixture('Snapshots')
  .page('http://localhost:8080');

test('check something here', async t => {
  // verify anything you want before
  await t
    .click('...')
    .expect('...')
    .ok();

  // then pass the `t` reference to invoke the helper
  await snapshot(t);
});
```

Run your tests adding `--snapshot` or declare `process.env.SNAPSHOT` to take the **base** screenshots.

```bash
$ npx testcafe chrome:headless tests/e2e/cases -s tests/screenshots --snapshot
```

Now run the same tests without `--snapshot` (or without `process.env.SNAPSHOT`) to take the **actual** screenshots to compare with.

Finally, invoke the CLI for generating a simple index.html report on the same directory where the screenshots are placed, e.g.

```bash
$ npx testcafe-blink-diff tests/screenshots --open
```

That's all, explore the generated report and enjoy!
