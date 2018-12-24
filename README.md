[![NPM version](https://badge.fury.io/js/testcafe-blink-diff.png)](http://badge.fury.io/js/testcafe-blink-diff)
[![Known Vulnerabilities](https://snyk.io/test/npm/testcafe-blink-diff/badge.svg)](https://snyk.io/test/npm/testcafe-blink-diff)

# How it works?

Install this dependency in your project, e.g. `npm i testcafe-blink-diff --save-dev`

Call the `takeSnapshot()` helper within your tests, e.g.

```js
import { takeSnapshot } from 'testcafe-blink-diff';

fixture('Snapshots')
  .page('http://localhost:8080');

test('check something here', async t => {
  // verify anything you want before
  await t
    .click('...')
    .expect('...')
    .ok();

  // then pass the `t` reference to invoke the helper
  await takeSnapshot(t);
});
```

Each time you run tests with `--take-snapshot base` it'll take the **base** screenshots.

```bash
$ npx testcafe chrome:headless tests/e2e/cases -s tests/screenshots --take-snapshot
```

Now run the same tests `--take-snapshot actual` to take the **actual** screenshots to compare with.

Finally, invoke the CLI for generating a simple `generated/index.html` report, e.g.

```bash
$ npx testcafe-blink-diff tests/screenshots --compare base:actual --open --threshold 0.03 # <= 3% is OK
```

That's all, explore the generated report and enjoy!

<p align="center">
  <img width="479" height="347" src="screenshot.png">
</p>
