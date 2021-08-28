/* eslint-disable no-return-assign */
/* eslint-disable prefer-object-spread */

require('global-or-local').devDependencies(['testcafe']);

const { Selector } = require('testcafe');
const path = require('path');
const fs = require('fs');

const isFullPage = process.env.FULL_PAGE || (process.argv.slice(2).indexOf('--full-page') !== -1);
const isTakeSnapshot = process.env.TAKE_SNAPSHOT || process.argv.slice(2).indexOf('--take-snapshot');
const snapshotName = isTakeSnapshot > -1 ? process.argv.slice(2)[isTakeSnapshot + 1] : null;

const type = (snapshotName && snapshotName.match(/^[a-z\d_]/) ? snapshotName : null)
  || (isTakeSnapshot !== -1 ? 'base' : 'actual');

function getCurrentStack() {
  let found;

  return (new Error()).stack.split('\n').filter(x => {
    if (x.indexOf('anonymous') !== -1) return false;
    if (found || x.indexOf(' at ') === -1) return true;
    if (x.indexOf('takeSnapshot') !== -1) {
      found = true;
      return false;
    }

    return found;
  }).join('\n');
}

function noop() {
  // do nothing
}

function debug(message, options) {
  console.log(options.label);
  console.log(`  \x1b[33m${message}\x1b[0m`);
}

function normalize(value) {
  return value
    .replace(/_/g, '__')
    .replace(/[^a-zA-Z/\d%[(@;,.)\]_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/\//g, '-or-');
}

function _takeSnapshot(t, opts, extra) {
  if (typeof opts === 'string') {
    opts = Object.assign({}, extra, { label: opts });
  }

  const options = Object.assign({}, opts);
  const groupId = options.base || t.testRun.test.fixture.name;
  const filename = normalize(options.label || t.testRun.test.name);
  const imagePath = `${normalize(groupId)}/${filename}/${options.as || type}.png`;
  const selectors = !Array.isArray(options.selector) && options.selector ? [options.selector] : options.selector;

  // correctly set up fullPage variable
  if (!options.fullPage && !isFullPage) {
    options.fullPage = false;
  } else {
    options.fullPage = true;
  }

  let exists;
  let found;
  let skip;

  function notFound(x) {
    skip = true;

    const key = Object.getOwnPropertySymbols(x)[0];

    debug(`Selector('${x[key].fn}') was not found on the DOM`, options);
  }

  return Promise.resolve()
    .then(() => t.wait(options.timeout === false ? 0 : (options.timeout || 500)))
    .then(() => {
      if (!selectors) {

        return Promise.resolve()
          // testcafe's api for takeScreenshot has changed: https://devexpress.github.io/testcafe/documentation/test-api/actions/take-screenshot.html
          .then(() => !found && t.takeScreenshot({ path: imagePath, fullPage: options.fullPage }))
          .then(() => { found = !!exists; });
      }
    })
    .then(() => {
      // stop on first existing node
      return (selectors || []).reduce((prev, cur) => {
        return prev.then(() => {
          if (found || exists) return;

          const sel = typeof cur === 'function'
            ? cur.with({ boundTestRun: t })
            : Selector(cur);

          return Promise.resolve()
            .then(() => sel.exists)
            .then(ok => { return exists = ok; })
            .then(ok => (ok && !found ? t.takeElementScreenshot(sel, imagePath) : notFound(sel)))
            .then(() => { found = !!exists; });
        });
      }, Promise.resolve());
    })
    .then(() => {
      if (skip) return;
      if (options.blockOut) {
        const blocks = Array.isArray(options.blockOut) ? options.blockOut : [options.blockOut];
        const results = [];

        return Promise.all(blocks.map(x => {
          if (typeof x !== 'function') {
            debug(`Expecting a Selector() instance, given '${x}'`, options);
            return;
          }

          let result;

          return Promise.resolve()
            .then(() => x.with({ boundTestRun: t }))
            .then(_result => Promise.resolve()
            .then(() => _result.exists)
            .then(() => {
              result = _result;
            }))
            .catch(() => { /* do nothing */ })
            .then(() => {
              if (!result) {
                notFound(x);
              }

              return result.count;
            })
            .then(length => Promise.all(Array.from({ length }).map((_, i) => result.nth(i).boundingClientRect)))
            .then(_results => {
              results.push(..._results);
            });
        })).then(() => {
          let screenshotsDir = t.testRun.opts.screenshotPath || (t.testRun.opts.screenshots || {}).path;

          if (!screenshotsDir) {
            debug(`Unable to read screenshots.path, using current dir`, options);
            screenshotsDir = path.dirname(t.testRun.test.testFile.filename);
          }

          const baseDir = path.join(screenshotsDir, path.dirname(imagePath));
          const metaFile = path.join(baseDir, 'blockOut.json');

          fs.writeFileSync(metaFile, JSON.stringify(results.filter(Boolean)));
        });
      }
    });
}

function takeSnapshot(t, opts, extra) {
  const fixedStack = getCurrentStack();

  return _takeSnapshot(t, opts, extra).catch(e => {
    const err = e.isTestCafeError ? new Error(`takeSnapshot(${e.apiFnChain ? e.apiFnChain[0] : ''}) failed${e.errMsg ? `; ${e.errMsg}` : ''}`) : e;

    err.stack = fixedStack;

    throw err;
  });
}

module.exports = {
  takeSnapshot: isTakeSnapshot === -1 ? noop : takeSnapshot,
};
