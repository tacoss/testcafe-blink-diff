/* eslint-disable no-return-assign */
/* eslint-disable prefer-object-spread */

const { Selector } = require('testcafe');
const path = require('path');
const fs = require('fs');

const isFullPage = process.env.FULL_PAGE || process.argv.slice(2).indexOf('--full-page');
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
  console.warn(`${options.label}\n  \x1b[33m${message}\x1b[0m`);
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
  const groupId = t.testRun.test.fixture.name;
  const filename = normalize(options.label || t.testRun.test.name);
  const imagePath = `${normalize(groupId)}/${filename}/${options.as || type}.png`;

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
      const selectors = !Array.isArray(options.selector) && options.selector ? [options.selector] : options.selector;

      // stop on first existing node
      return selectors.reduce((prev, cur) => {
        if (found) return prev;
        return prev.then(() => {
          if (!isFullPage || cur) {
            const sel = typeof cur === 'function'
              ? cur.with({ boundTestRun: t })
              : Selector(cur);

            return Promise.resolve()
              .then(() => { return found = sel.exists; })
              .then(ok => (ok ? t.takeElementScreenshot(sel, imagePath) : notFound(sel)));
          }

          return t.takeScreenshot(imagePath);
        });
      }, Promise.resolve());
    })
    .then(() => {
      if (skip) return;
      if (options.blockOut) {
        const selectors = Array.isArray(options.blockOut) ? options.blockOut : [options.blockOut];
        const results = [];

        return Promise.all(selectors.map(x => {
          if (typeof x !== 'function') {
            debug(`Expecting a Selector() instance, given '${x}'`, options);
            return;
          }

          let result;

          return Promise.resolve()
            .then(() => x.with({ boundTestRun: t }))
            .then(_result => {
              result = _result;
            })
            .catch(() => { /* do nothing */ })
            .then(() => {
              if (!result) {
                notFound(x);
              }

              results.push(result.boundingClientRect);
            });
        })).then(() => {
          const baseDir = path.join(t.testRun.opts.screenshotPath, path.dirname(imagePath));
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
