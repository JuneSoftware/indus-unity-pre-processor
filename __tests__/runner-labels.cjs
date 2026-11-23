const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function runAction(entry, overrides = {}) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'indus-preprocessor-labels-'));
  const output = path.join(fixture, 'output');
  fs.writeFileSync(output, '');
  try {
    const env = { ...process.env, GITHUB_OUTPUT: output,
      INPUT_CUSTOMBUILDNUMBER: '123', INPUT_BUILDENVIRONMENT: 'Development',
      INPUT_BUILDTARGETONE: 'Android', INPUT_BUILDTARGETTWO: 'Play Store',
      INPUT_BUILDTARGETTHREE: 'Linux Server', INPUT_BUILDTARGETFOUR: 'Windows', INPUT_BUILDTARGETFIVE: 'iOS',
      INPUT_SLACKCHANNEL: 'Public', INPUT_SLACKDATA: '{"Public":"TEST_WEBHOOK"}',
      INPUT_EVIRONMENTDATA: '{"Development":{}}', INPUT_BUILDCONFIG: 'Default',
      INPUT_BUILDCONFIGDATA: '{"Default":"test.asset"}',
      INPUT_ANDROIDPGOMODE: 'Disabled', INPUT_ANDROIDLTOMODE: 'Disabled',
      INPUT_PLAYSTOREPGOMODE: 'Disabled', INPUT_PLAYSTORELTOMODE: 'Disabled', ...overrides };
    const result = spawnSync(process.execPath, [entry], { cwd: path.join(__dirname, '..'), env, encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const match = /^selectedTarget<<([^\r\n]+)\r?\n([^\r\n]+)\r?\n\1/m.exec(fs.readFileSync(output, 'utf8'));
    const legacy = /^::set-output name=selectedTarget::(.+)$/m.exec(result.stdout);
    assert.ok(match || legacy, 'Action must emit a selectedTarget matrix: ' + result.stdout);
    const value = match ? match[2] : legacy[1].replace(/%0D/g, '\r').replace(/%0A/g, '\n').replace(/%25/g, '%');
    return JSON.parse(value);
  } finally {
    fs.unlinkSync(output);
    fs.rmdirSync(fixture);
  }
}

function requirements(matrix) {
  return Object.fromEntries(matrix.map(target => [target.customPlatformName, target.requiredRunnerLabels]));
}

test('default matrix retains platform data without requiring FullLTO', () => {
  const matrix = runAction('lib/main.js');
  assert.deepEqual(requirements(matrix), { Android: [], PlayStore: [], LinuxServer64: [], Windows64: [], iOS: [] });
  assert.equal(matrix[0].platform, 'Android');
  assert.equal(matrix[0].modules, 'android');
  assert.equal(matrix[0].buildConfigData, 'test.asset');
});

test('Full LTO labels are selected independently for Android and Play Store', () => {
  const matrix = runAction('lib/main.js', { INPUT_ANDROIDPGOMODE: 'Use', INPUT_ANDROIDLTOMODE: 'Full', INPUT_PLAYSTORELTOMODE: 'Thin' });
  assert.deepEqual(requirements(matrix), { Android: ['FullLTO'], PlayStore: [], LinuxServer64: [], Windows64: [], iOS: [] });
});

test('Train disables the Full LTO requirement while the other platform still requires it', () => {
  const matrix = runAction('lib/main.js', { INPUT_ANDROIDPGOMODE: 'Train', INPUT_ANDROIDLTOMODE: 'Full', INPUT_PLAYSTORELTOMODE: 'Full' });
  assert.deepEqual(requirements(matrix), { Android: [], PlayStore: ['FullLTO'], LinuxServer64: [], Windows64: [], iOS: [] });
});

test('both Android platforms can require Full LTO without affecting desktop targets', () => {
  const matrix = runAction('lib/main.js', { INPUT_ANDROIDLTOMODE: 'Full', INPUT_PLAYSTORELTOMODE: 'Full' });
  assert.deepEqual(requirements(matrix), { Android: ['FullLTO'], PlayStore: ['FullLTO'], LinuxServer64: [], Windows64: [], iOS: [] });
});

test('mode matching preserves case-insensitive workflow behavior', () => {
  const matrix = runAction('lib/main.js', { INPUT_ANDROIDPGOMODE: 'TRAIN', INPUT_ANDROIDLTOMODE: 'full', INPUT_PLAYSTORELTOMODE: 'FULL' });
  assert.deepEqual(requirements(matrix), { Android: [], PlayStore: ['FullLTO'], LinuxServer64: [], Windows64: [], iOS: [] });
});

test('packaged action includes the runner-label behavior', () => {
  const matrix = runAction('dist/index.js', { INPUT_ANDROIDLTOMODE: 'Full', INPUT_PLAYSTOREPGOMODE: 'Train', INPUT_PLAYSTORELTOMODE: 'Full' });
  assert.deepEqual(requirements(matrix), { Android: ['FullLTO'], PlayStore: [], LinuxServer64: [], Windows64: [], iOS: [] });
});
test('existing Google Play Games for PC support is preserved in compiled and packaged actions', () => {
  for (const entry of ['lib/main.js', 'dist/index.js']) {
    const matrix = runAction(entry, { INPUT_BUILDTARGETFIVE: 'Google Play Games For PC', INPUT_ANDROIDLTOMODE: 'Full' });
    const target = matrix.find(item => item.customPlatformName === 'GooglePlayGamesForPC');
    assert.ok(target);
    assert.equal(target.platform, 'Android');
    assert.equal(target.modules, 'android');
    assert.equal(target.subPlatformServer, 'Player');
    assert.deepEqual(target.requiredRunnerLabels, []);
  }
});
