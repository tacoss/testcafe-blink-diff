const { readPngFileSync, writePngFileSync } = require('node-libpng');
const { diffImages } = require('native-image-diff');

class ImageDiff {
  constructor(opts) {
    this.options = { ...opts };
  }

  run(callback) {
    const { image, pixels, totalDelta } = diffImages(readPngFileSync(this.options.imageAPath), readPngFileSync(this.options.imageBPath));

    writePngFileSync(this.options.imageOutputPath, image.data, { width: image.width, height: image.height });

    callback({
      width: image.width,
      height: image.height,
      dimension: totalDelta,
      differences: pixels,
    });
  }

  hasPassed(percentage) {
    return percentage <= this.options.threshold;
  }
}

module.exports = ImageDiff;
