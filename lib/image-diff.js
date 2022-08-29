const fs = require('fs');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

function readPngImage(image) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(image).pipe(new PNG())
      .on('parsed', function onParse() {
        resolve(this);
      })
      .on('error', reject);
  });
}

function fixPngImage(image, width, height) {
  if (image.width !== width || image.height !== height) {
    const fixedImage = new PNG({
      width,
      height,
      bitDepth: image.bitDepth,
      inputHasAlpha: true,
    });

    PNG.bitblt(image, fixedImage, 0, 0, image.width, image.height, 0, 0);
    return fixedImage;
  }
  return image;
}

function fillPngRect(image, x, y, w, h) {
  const fillImage = new PNG({
    colorType: 2,
    bgColor: {
      red: 255,
      green: 0,
      blue: 0,
    },
    width: w,
    height: h,
  });

  fillImage.bitblt(image, 0, 0, w, h, x, y);
}

class ImageDiff {
  constructor(opts) {
    this.options = { ...opts };
    this.width = 0;
    this.height = 0;
    this.resolution = 0;
    this.differences = 0;
  }

  async run(callback) {
    const aImage = await readPngImage(this.options.imageAPath);
    const bImage = await readPngImage(this.options.imageBPath);

    const dstImage = new PNG({
      width: Math.max(aImage.width, bImage.width),
      height: Math.max(aImage.height, bImage.height),
    });

    if (this.options.blockOut) {
      const dpi = this.options.resolution || 1;

      [].concat(this.options.blockOut).forEach(area => {
        const x = (area.left * dpi) - 1;
        const y = (area.top * dpi) - 1;
        const w = (area.width * dpi) + 2;
        const h = (area.height * dpi) + 2;

        fillPngRect(aImage, x, y, w, h);
        fillPngRect(bImage, x, y, w, h);
      });
    }

    const aCanvas = await fixPngImage(aImage, dstImage.width, dstImage.height);
    const bCanvas = await fixPngImage(bImage, dstImage.width, dstImage.height);

    const options = { threshold: 0.1, diffMask: true };
    const result = pixelmatch(aCanvas.data, bCanvas.data, dstImage.data, dstImage.width, dstImage.height, options);

    dstImage.pack().pipe(fs.createWriteStream(this.getImageOutput()));

    callback(Object.assign(this, {
      width: dstImage.width,
      height: dstImage.height,
      differences: result,
    }));
  }

  getImageOutput() {
    return this.options.imageOutputPath;
  }

  getDifference() {
    // eslint-disable-next-line no-mixed-operators
    return Math.round(100 * 100 * this.differences / (this.width * this.height)) / 100;
  }

  hasPassed() {
    const percentage = this.getDifference();
    return percentage <= this.options.threshold;
  }
}

module.exports = ImageDiff;
