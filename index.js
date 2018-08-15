const isTakeSnapshot = process.argv.slice(2).indexOf('--take-snapshot');

// FIXME: take given value for custom naming, e.g. `--take-snapshot test`
const type = (process.env.SNAPSHOT || isTakeSnapshot !== -1) ? 'base' : 'actual';

function normalize(value) {
  return value.replace(/\W+/g, '_');
}

// FIXME: implement blockOut, e.g. take a list of selectors, retrieve their coordinates, remap, etc.
function takeSnapshot(t, label, timeout) {
  const filename = normalize(label || t.testRun.test.name).replace(/\//g, '__or__');
  const imagePath = `${normalize(t.testRun.test.fixture.name)}/${filename}/${type}.png`;

  return t.wait(timeout === false ? 0 : (timeout || 500)).takeScreenshot(imagePath);
}

module.exports = {
  takeSnapshot,
};
