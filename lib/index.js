const GROUPS = {};

const isFullPage = process.argv.slice(2).indexOf('--full-page');
const isTakeSnapshot = process.argv.slice(2).indexOf('--take-snapshot');
const snapshotName = isTakeSnapshot > -1 ? process.argv.slice(2)[isTakeSnapshot + 1] : null;

const type = (snapshotName && snapshotName.match(/^[a-z\d_]/) ? snapshotName : null)
  || (isTakeSnapshot !== -1 ? 'base' : 'actual');

function noop() {
  // do nothing
}

function padLeft(value) {
  return `000${value}`.substr(-3);
}

function normalize(value) {
  return value
    .replace(/_/g, '__')
    .replace(/[^a-zA-Z/\d%[(@;,.)\]_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/\//g, '-or-');
}

// FIXME: implement blockOut, e.g. take a list of selectors, retrieve their coordinates, remap, etc.
function takeSnapshot(t, opts) {
  const options = Object.assign({}, opts);
  const groupId = t.testRun.test.fixture.name;

  if (!GROUPS[groupId]) {
    GROUPS[groupId] = 0;
  }

  GROUPS[groupId] += 1;

  const offset = padLeft(GROUPS[groupId]);
  const filename = normalize(options.label || t.testRun.test.name);
  const imagePath = `${normalize(groupId)}/${offset}_${filename}/${type}.png`;

  const call = t.wait(options.timeout === false ? 0 : (options.timeout || 500));

  return ((!isFullPage || options.selector) ? call.takeElementScreenshot(options.selector || 'body', imagePath) : call.takeScreenshot(imagePath));
}

module.exports = {
  takeSnapshot: isTakeSnapshot === -1 ? noop : takeSnapshot,
};
