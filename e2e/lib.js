import { spawn } from 'node:child_process';
import process from 'node:process';

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

function callNpx(args) {
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  return new Promise(function fn(resolve) {
    const cmd = spawn(npx, args, { shell: true, stdio: 'inherit' });

    cmd.on('close', function onClose() {
      resolve();
    });
  });
}

function callTC(targetTest, additionalArgs) {
  const browser = process.env.BROWSER != null ? process.env.BROWSER : 'chrome:headless';
  const baseArgs = ['testcafe', browser, targetTest, '-s', 'path=e2e/screens', '-q'];
  return callNpx(baseArgs.concat(additionalArgs));
}

export {
  getBaseUrl, fixedSize, fixedFile, callTC,
};
