const path = require('path');
const fs = require('fs');

const isFullPage = process.argv.slice(2).indexOf('--full-page');
const isTakeSnapshot = process.argv.slice(2).indexOf('--take-snapshot');
const snapshotName = isTakeSnapshot > -1 ? process.argv.slice(2)[isTakeSnapshot + 1] : null;

const type = (snapshotName && snapshotName.match(/^[a-z\d_]/) ? snapshotName : null)
  || (isTakeSnapshot !== -1 ? 'base' : 'actual');

function noop() {
  // do nothing
}

function debug(message) {
  console.warn(`[testcafe-blink-diff] ${message}`);
}

function normalize(value) {
  return value
    .replace(/_/g, '__')
    .replace(/[^a-zA-Z/\d%[(@;,.)\]_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/\//g, '-or-');
}

async function takeSnapshot(t, opts, extra) {
  if (typeof opts === 'string') {
    opts = {
      ...extra,
      label: opts,
    };
  }

  const options = Object.assign({}, opts);
  const groupId = t.testRun.test.fixture.name;
  const filename = normalize(options.label || t.testRun.test.name);
  const imagePath = `${normalize(groupId)}/${filename}/${type}.png`;

  await t.wait(options.timeout === false ? 0 : (options.timeout || 500));

  if (options.blockOut) {
    const selectors = Array.isArray(options.blockOut) ? options.blockOut : [options.blockOut];
    const results = [];

    await Promise.all(selectors.map(async x => {
      if (typeof x !== 'function') {
        debug(`Expecting a Selector() instance, given '${x}'`);
        return;
      }

      let result;

      try {
        result = await x.with({ boundTestRun: t });
      } catch (e) {
        // do nothing
      } finally {
        if (!result) {
          const key = Object.getOwnPropertySymbols(x)[0];

          debug(`Selector('${x[key].fn}') was not found on the DOM`);
        }

        results.push(result.boundingClientRect);
      }
    }));

    const baseDir = path.join(t.testRun.opts.screenshotPath, path.dirname(imagePath));
    const metaFile = path.join(baseDir, 'blockOut.json');

    fs.writeFileSync(metaFile, JSON.stringify(results.filter(Boolean)));
  }

  if (!isFullPage || options.selector) {
    await t.takeElementScreenshot(options.selector || 'body', imagePath);
  } else {
    await t.takeScreenshot(imagePath);
  }
}

module.exports = {
  takeSnapshot: isTakeSnapshot === -1 ? noop : takeSnapshot,
};
