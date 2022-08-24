const { readPngFileSync, writePngFileSync, colorRGBA, rect } = require('node-libpng');
const { diffImages } = require('native-image-diff');

class ImageDiff {
  constructor(opts) {
    this.options = { ...opts };
  }

  run(callback) {
    const aImage = readPngFileSync(this.options.imageAPath);
    const bImage = readPngFileSync(this.options.imageBPath);

    if (this.options.blockOut) {
      const aColor = colorRGBA(255, 0, 0, 1);
      const bColor = colorRGBA(255, 0, 0, 1);

      [].concat(this.options.blockOut).forEach(area => {
        aImage.fill(aColor, rect(area.x, area.y, area.width, area.height));
        bImage.fill(bColor, rect(area.x, area.y, area.width, area.height));
      });
    }

    const { image, pixels, totalDelta } = diffImages(aImage, bImage);

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
