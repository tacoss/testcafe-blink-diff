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

// taken screenshots may have been aliased, so
// we move the rectangle a bit to crop around it
function getBlockOutArea(image, area, dpi) {
  // if left|top were 0, then we would write outside the image!
  const x = Math.max(0, (area.left * dpi) - 1);
  const y = Math.max(0, (area.top * dpi) - 1);

  // if x+w|y+h > width|height, we would write outside the image!
  const w = Math.min((area.width * dpi) + 2, image.width - x);
  const h = Math.min((area.height * dpi) + 2, image.height - y);

  return {
    x, y, w, h,
  };
}

class ImageDiff {
  constructor(opts) {
    this.options = { ...opts };
    this.width = 0;
    this.height = 0;
    this.differences = 0;
  }

  async run(callback) {
    const aImage = await readPngImage(this.options.imageAPath);
    const bImage = await readPngImage(this.options.imageBPath);

    const dstImage = new PNG({
      width: Math.max(aImage.width, bImage.width),
      height: Math.max(aImage.height, bImage.height),
    });

    if (this.options.blockOutA) {
      [].concat(this.options.blockOutA).forEach(area => {
        const {
          x, y, w, h,
        } = getBlockOutArea(aImage, area, this.options.resolutionA || 1);
        if (w && h && x < aImage.width && y < aImage.height) {
          fillPngRect(aImage, x, y, Math.min(w, aImage.width - x), Math.min(h, aImage.height - y));
        }
      });
    }
    if (this.options.blockOutB) {
      [].concat(this.options.blockOutB).forEach(area => {
        const {
          x, y, w, h,
        } = getBlockOutArea(bImage, area, this.options.resolutionB || 1);
        if (w && h && x < bImage.width && y < bImage.height) {
          fillPngRect(bImage, x, y, Math.min(w, bImage.width - x), Math.min(h, bImage.height - y));
        }
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
