const { readPngFileSync, writePngFileSync, colorRGBA, rect } = require('node-libpng');
const { diffImages } = require('native-image-diff');
const path = require('path');

class ImageDiff {
  constructor(opts) {
    this.options = { ...opts };
    this.width = 0;
    this.height = 0;
    this.dimension = 0;
    this.resolution = 0;
    this.differences = 0;
  }

  run(callback) {
    const aImage = readPngFileSync(this.options.imageAPath);
    const bImage = readPngFileSync(this.options.imageBPath);

    if (this.options.blockOut) {
      const aColor = colorRGBA(255, 0, 0, 1);
      const bColor = colorRGBA(255, 0, 0, 1);
      const dpi = this.options.resolution || 1;

      [].concat(this.options.blockOut).forEach(area => {
        const x = (area.left * dpi) - 1;
        const y = (area.top * dpi) - 1;
        const w = (area.width * dpi) + 2;
        const h = (area.height * dpi) + 2;

        aImage.fill(aColor, rect(x, y, w, h));
        bImage.fill(bColor, rect(x, y, w, h));
      });
    }

    const { image, pixels, totalDelta } = diffImages(aImage, bImage);

    writePngFileSync(this.getImageOutput(), image.data, { width: image.width, height: image.height });

    callback(Object.assign(this, {
      width: image.width,
      height: image.height,
      dimension: totalDelta,
      differences: pixels,
    }));
  }

  getImageOutput() {
    return this.options.imageOutputPath;
  }

  getDifference() {
    return this.differences && this.dimension
      ? ((this.differences / this.dimension) * 100).toFixed(2)
      : 0;
  }

  hasPassed() {
    const percentage = this.getDifference();
    return percentage <= this.options.threshold;
  }
}

module.exports = ImageDiff;
