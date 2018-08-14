// FIXME: implement blockOut, e.g. take a list of selectors, retrieve their coordinates, and remap

function snapshot(t, label) {
  const suffix = process.env.SNAPSHOT || process.argv.slice(2).indexOf('--snapshot') !== -1 ? 'base' : 'actual';
  const imagePath = `${(label || t.testRun.test.name).replace(/\//g, '__or__').replace(/\W+/g, '_')}_${suffix}.png`;

  return t.takeScreenshot(imagePath);
}

module.exports = {
  snapshot,
};
