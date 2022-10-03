const wargs = require('wargs');
const path = require('path');
const fs = require('fs');

const pkgInfo = require('../package.json');
const ImageDiff = require('./image-diff');

const USAGE_INFO = `
Usage:
  ${pkgInfo.name} [SCREENSHOTS_DIRECTORY] [OUTPUT_DIRECTORY]

Options:
  -o, --open       Browse generated report
  -y, --only       Filter images to process
  -f, --force      Ignore missing screenshots
  -x, --filter     Filter out specific screenshots
  -c, --compare    Custom snapshots, e.g. \`-c base:actual\`
  -t, --threshold  Percentage of difference expected

Snapshots:

- Import and call \`await takeSnapshot(t)\` within your tests,
  e.g. \`import { takeSnapshot } from '${pkgInfo.name}';\`

- Run testcafe with \`--take-snapshot base\` to take the base screenshots,
  run again with \`--take-snapshot actual\` to take actual screenshots

- Run ${pkgInfo.name} to generate a report from the taken screenshots,
  e.g. \`npx ${pkgInfo.name} tests/screenshots --open --threshold 0.03\`

You can name your snapshots, e.g. \`--take-snapshot latest\` and compare with \`--compare v1:latest \`
`;

const cwd = process.cwd();
const argv = wargs(process.argv.slice(2), {
  alias: {
    t: 'threshold',
    c: 'compare',
    v: 'version',
    x: 'filter',
    f: 'force',
    y: 'only',
    o: 'open',
  },
  boolean: 'vfo',
});

if (argv.flags.version) {
  console.log(`${pkgInfo.name} v${pkgInfo.version}`);
  process.exit();
}

if (!argv._.length) {
  console.log(USAGE_INFO);
  process.exit();
}

const filterRegExp = new RegExp(argv.flags.filter || '.*', 'i');
const imagesPath = path.resolve(argv._[0] || 'screenshots');
const destPath = path.resolve(argv._[1] || 'generated');
const destFile = `${destPath}/index.html`;

const ratio = parseFloat(argv.flags.threshold || '0.01');
const only = [].concat(argv.flags.only || []);

console.log('Collecting screenshots...');

const sources = require('glob') // eslint-disable-line
  .sync('**/*.png', { cwd: imagesPath })
  .filter(x => {
    if (x.indexOf('out.png') === -1) {
      return filterRegExp.test(x);
    }

    return false;
  });

const images = sources
  .filter(x => x.indexOf('thumbnails') === -1)
  .reduce((prev, cur) => {
    if (only.length && !only.some(x => cur.includes(x))) return prev;

    const groupedName = path.basename(cur, '.png').replace(/@[\d.]+$/, '');
    const fixedName = `${path.dirname(cur) === '.' ? groupedName : path.dirname(cur)}`
      .replace(/__/g, '§')
      .replace('-or-', '/')
      .replace(/_/g, ' ')
      .replace(/§/g, '_');

    if (!prev[fixedName]) {
      prev[fixedName] = {};
    }

    prev[fixedName][groupedName] = path.join(imagesPath, cur);

    return prev;
  }, {});

function readFile(filename) {
  return fs.readFileSync(path.resolve(__dirname, `../${filename}`)).toString();
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
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function build() {
  const tasks = [];
  const check = (argv.flags.compare || '').split(':');
  const left = check[0] || 'base';
  const right = check[1] || 'actual';

  let failed;
  Object.keys(images).forEach(groupedName => {
    if (!(images[groupedName][left] && images[groupedName][right])) {
      const errorMessage = `Missing snapshots for '${groupedName}'`;

      if (!argv.flags.force) {
        console.error(`${errorMessage}, given ${left}:${right}`);
        process.exit(1);
      }

      console.warn(`  ${errorMessage}`); // eslint-disable-line
      return;
    }

    const actualImage = path.relative(imagesPath, images[groupedName][right]);
    const baseImage = path.relative(imagesPath, images[groupedName][left]);
    const baseDir = path.dirname(images[groupedName][left]);
    const legacyBlockFile = path.join(baseDir, 'blockOut.json');
    const blockFileA = path.join(baseDir, `blockOut-${left}.json`);
    const blockFileB = path.join(baseDir, `blockOut-${right}.json`);
    const outFile = path.join(baseDir, 'out.png');

    tasks.push(new Promise(resolve => {
      const legacyBlockOut = fs.existsSync(legacyBlockFile) ? require(legacyBlockFile) : [];
      const blockOutA = fs.existsSync(blockFileA) ? require(blockFileA) : null;
      const blockOutB = fs.existsSync(blockFileB) ? require(blockFileB) : null;
      const nameA = path.basename(images[groupedName][left], '.png');
      const nameB = path.basename(images[groupedName][right], '.png');

      const diff = new ImageDiff({
        imageOutputPath: outFile,
        imageAPath: images[groupedName][left],
        imageBPath: images[groupedName][right],
        resolutionA: nameA.split('@')[1] || 1,
        resolutionB: nameB.split('@')[1] || 1,
        threshold: ratio,
        blockOutA: blockOutA || legacyBlockOut,
        blockOutB: blockOutB || legacyBlockOut,
      });

      return diff.run(() => {
        const fixed = diff.getDifference();
        const errorMessage = `Failed with ${fixed}% of differences`;
        const fixedName = groupedName.replace(/\//g, ' / ');
        const ok = diff.hasPassed();

        process.stdout.write(`  ${fixedName} (${ok ? '' : 'NOT '}PASS)\n`);

        if (!ok) {
          console.warn(`    ${errorMessage}`); // eslint-disable-line
          failed = true;
        }

        sources.push(path.relative(imagesPath, diff.getImageOutput()));

        const prefix = baseDir === '.' ? '' : path.relative(imagesPath, baseDir);

        resolve({
          thumbnails: {
            actual: path.join(prefix, `thumbnails/${path.basename(actualImage)}`),
            base: path.join(prefix, `thumbnails/${path.basename(baseImage)}`),
          },
          images: {
            actual: actualImage,
            base: baseImage,
            out: path.relative(imagesPath, diff.getImageOutput()),
          },
          height: diff.height,
          width: diff.width,
          label: fixedName,
          diff: fixed,
          dpi: diff.options.resolutionA,
          dpiActual: diff.options.resolutionB,
          dpiBase: diff.options.resolutionA,
          ok,
        });
      });
    }));
  });

  process.stdout.write(`\rProcessing ${tasks.length} file${tasks.length === 1 ? '' : 's'}...\n`); // eslint-disable-line

  return Promise.all(tasks).then(results => ({ failed, results }));
}

function render(reportInfo) {
  return readFile('lib/index.html')
    .replace('/* json */', JSON.stringify(reportInfo))
    .replace('/* code */', readFile('dist/reporter.umd.js'));
}

let exitCode = 0;

Promise.resolve()
  .then(() => build())
  .then(({ failed, results }) => {
    if (failed) {
      exitCode = 1;
    }

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
      require('open')(destFile, typeof argv.flags.open === 'string' ? argv.flags.open : undefined);
    }
  })
  .catch(e => {
    console.error(`[ERR] ${e.message}`); // eslint-disable-line
    process.exit(1);
  })
  .then(() => {
    process.exit(exitCode);
  });
