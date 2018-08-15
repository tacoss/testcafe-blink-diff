const BlinkDiff = require('blink-diff');
const wargs = require('wargs');
const open = require('open');
const glob = require('glob');
const path = require('path');
const fs = require('fs');

const pkgInfo = require('./package.json');

const USAGE_INFO = `
Usage:
  ${pkgInfo.name} [SCREENSHOTS_DIRECTORY] [OUTPUT_DIRECTORY]

Options:
  -o, --open       Browse generated report
  -f, --force      Ignore missing screenshots
  -t, --threshold  Percentage of difference expected

Snapshots:

- Import and call \`await takeSnapshot(t)\` within your tests, e.g. \`import { takeSnapshot } from '${pkgInfo.name}';\`
- Run testcafe with \`--take-snapshot\` to take the base screenshots, run again without \`--take-snapshot\` to take actual screenshots
- Run ${pkgInfo.name} to generate a report from the taken screenshots, e.g. \`npx ${pkgInfo.name} tests/screenshots --open --threshold 0.03\`
`;

const cwd = process.cwd();
const argv = wargs(process.argv.slice(2), {
  alias: {
    v: 'version',
  },
  boolean: 'v',
});

console.log(`${pkgInfo.name} v${pkgInfo.version}`);

if (argv.flags.version) {
  process.exit();
}

if (!argv._.length) {
  console.log(USAGE_INFO);
  process.exit();
}

const imagesPath = path.resolve(argv._[0] || 'screenshots');
const destPath = path.resolve(argv._[1] || 'generated');
const destFile = `${destPath}/index.html`;

const ratio = parseFloat(argv.flags.threshold || '0.01');

console.log('Collecting screenshots...');

const sources = glob
  .sync('**/*.png', { cwd: imagesPath })
  .filter(x => x.indexOf('out.png') === -1);

const images = sources
  .filter(x => x.indexOf('thumbnails') === -1)
  .reduce((prev, cur) => {
    const groupedName = cur.match(/\/(actual|base)\.png$/);
    const fixedName = cur.replace(groupedName[0], '')
      .replace(/__/g, '§')
      .replace('-or-', '/')
      .replace(/_/g, ' ')
      .replace(/§/g, '_');

    if (!prev[fixedName]) {
      prev[fixedName] = {};
    }

    prev[fixedName][groupedName[1]] = path.join(imagesPath, cur);

    return prev;
  }, {});

function readFile(filename) {
  return fs.readFileSync(`${__dirname}/${filename}`).toString();
}

function copyFile(source, target) {
  const rd = fs.createReadStream(source);
  const wr = fs.createWriteStream(target);

  return new Promise((resolve, reject) => {
    rd.on('error', reject);
    wr.on('error', reject);
    wr.on('finish', resolve);
    rd.pipe(wr);
  }).catch(e => {
    rd.destroy();
    wr.end();
    throw e;
  });
}

function mkdirp(filepath) {
  const rel = path.relative(cwd, filepath);
  const parts = rel.split('/').reduce((prev, cur, i, v) => {
    prev.push(path.join(cwd, v.slice(0, i + 1).join('/')));
    return prev;
  }, []);

  parts.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  });
}

function build() {
  const data = [];

  Object.keys(images).forEach(groupedName => {
    if (!(images[groupedName].base && images[groupedName].actual)) {
      const errorMessage = `Missing snapshots for '${groupedName}'`;

      if (!argv.flags.force) {
        throw new Error(errorMessage);
      }

      console.warn(`  ${errorMessage}`); // eslint-disable-line
      return;
    }

    console.log(`Processing '${groupedName}' ...`); // eslint-disable-line

    const actualImage = path.relative(imagesPath, images[groupedName].actual);
    const baseImage = path.relative(imagesPath, images[groupedName].base);
    const baseDir = path.dirname(images[groupedName].base);
    const outFile = path.join(baseDir, 'out.png');

    const diff = new BlinkDiff({
      imageAPath: images[groupedName].base,
      imageBPath: images[groupedName].actual,

      thresholdType: BlinkDiff.THRESHOLD_PERCENT,
      threshold: ratio,

      // FIXME: reduce usage of this by improving the UI?
      // composition: false,

      imageOutputPath: outFile,
    });

    data.push(new Promise((resolve, reject) => {
      diff.run((error, result) => {
        if (error) {
          reject(error);
        } else {
          const ok = diff.hasPassed(result.code);

          if (!ok && !argv.flags.force) {
            reject(new Error(`Failed '${groupedName}', diff: ${result.differences}`));
            return;
          }

          resolve({
            thumbnails: {
              actual: path.join(baseDir === '.' ? '' : baseDir, `thumbnails/${path.basename(actualImage)}`),
              base: path.join(baseDir === '.' ? '' : baseDir, `thumbnails/${path.basename(baseImage)}`),
            },
            images: {
              actual: actualImage,
              base: baseImage,
              out: outFile,
            },
            height: result.height,
            width: result.width,
            label: groupedName,
            diff: ((result.differences / result.dimension) * 100).toFixed(2),
            ok,
          });
        }
      });
    }));
  });

  return Promise.all(data);
}

function render(reportInfo) {
  return readFile('index.html')
    .replace('/* json */', JSON.stringify(reportInfo))
    .replace('/* code */', `!function() { ${readFile('report.js')} }()`);
}

Promise.resolve()
  .then(() => build())
  .then(results => {
    mkdirp(destPath);

    const tasks = [];

    if (destPath !== imagesPath) {
      sources.forEach(img => {
        const imgDest = path.join(destPath, img);
        const imgSrc = path.join(imagesPath, img);

        mkdirp(path.dirname(imgDest));

        tasks.push(copyFile(imgSrc, imgDest));
      });
    }

    fs.writeFileSync(destFile, render(results));

    console.log(`Write ${path.relative(cwd, destFile)}`); // eslint-disable-line

    return Promise.all(tasks);
  })
  .then(() => {
    if (argv.flags.open) {
      open(destFile, typeof argv.flags.open === 'string' ? argv.flags.open : undefined);
    }
  })
  .catch(e => {
    console.error(`[ERR] ${e.message}`); // eslint-disable-line
    process.exit(1);
  });
