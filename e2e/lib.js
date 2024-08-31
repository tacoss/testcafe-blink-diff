// this enforces a particular DPI to allow
// tests to behave in a deterministic way!!
process.env.WINDOW_DPI = process.env.WINDOW_DPI || '2';

function getBaseUrl() {
  return `${process.env.BASE_URL}/`;
}

function fixedSize(value) {
  return value * process.env.WINDOW_DPI;
}

function fixedFile(name) {
  if (process.env.WINDOW_DPI > 1) {
    return name.replace('.', `@${process.env.WINDOW_DPI}.`);
  }
  return name;
}

export { getBaseUrl, fixedSize, fixedFile };
