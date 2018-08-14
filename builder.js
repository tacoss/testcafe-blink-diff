const BlinkDiff = require('blink-diff');
const open = require('open');
const glob = require('glob');
const path = require('path');
const fs = require('fs');

const imagesPath = path.resolve(process.argv.slice(2)[0] || 'screenshots');

console.log('Processing screenshots...');

const images = glob
  .sync('**/*.png', { cwd: imagesPath })
  .filter(x => x.indexOf('thumbnails') === -1 && x.indexOf('_out.png') === -1)
  .reduce((prev, cur) => {
    const groupedName = cur.match(/_(actual|base)\.png$/);
    const fixedName = cur.replace(groupedName[0], '')
      .replace('__or__', '/')
      .replace(/_/g, ' ');

    if (!prev[fixedName]) {
      prev[fixedName] = {};
    }

    prev[fixedName][groupedName[1]] = path.join(imagesPath, cur);

    return prev;
  }, {});

const ratio = parseFloat(process.env.THRESHOLD_PERCENT || '0.01');
const data = [];

Object.keys(images).forEach(groupedName => {
  if (!images[groupedName].actual) {
    console.warn(`Missing actual snapshot for '${groupedName}'`); // eslint-disable-line
    return;
  }

  const diff = new BlinkDiff({
    imageAPath: images[groupedName].base,
    imageBPath: images[groupedName].actual,

    thresholdType: BlinkDiff.THRESHOLD_PERCENT,
    threshold: ratio,

    // FIXME: reduce usage of this by improving the UI?
    // composition: false,

    imageOutputPath: images[groupedName].base.replace('_base.png', '_out.png')
  });

  data.push(new Promise((resolve, reject) => {
    diff.run((error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve({
          thumbnails: {
            actual: `thumbnails/${path.relative(imagesPath, images[groupedName].actual)}`,
            base: `thumbnails/${path.relative(imagesPath, images[groupedName].base)}`,
          },
          images: {
            actual: path.relative(imagesPath, images[groupedName].actual),
            base: path.relative(imagesPath, images[groupedName].base),
            out: path.relative(imagesPath, images[groupedName].base.replace('_base.png', '_out.png')),
          },
          label: groupedName,
          diff: result.differences,
          ok: diff.hasPassed(result.code)
        });
      }
    });
  }));
});

function render(reportInfo) {
  return fs.readFileSync(`${__dirname}/index.html`).toString()
    .replace('{json}', JSON.stringify(reportInfo))
    .replace('{code}', `!function() { ${fs.readFileSync(`${__dirname}/report.js`)} }()`);
}

Promise.all(data)
  .then(results => {
    const destFile = `${imagesPath}/index.html`;

    fs.writeFileSync(destFile, render(results));

    console.log(`Write ${path.relative(process.cwd(), destFile)}`); // eslint-disable-line

    if (process.argv.slice(2).indexOf('--open') !== -1) {
      open(destFile);
    }
  });
