const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const tests = fs
  .readdirSync(path.join(__dirname, "test"))
  .filter((name) => name.endsWith(".test.js"))
  .map((name) => path.join("test", name));

const result = spawnSync(
  process.execPath,
  [
    "--experimental-test-coverage",
    "--test-coverage-include=controllers/**/*.js",
    "--test-coverage-include=utils/alertEngine.js",
    "--test-coverage-lines=60",
    "--test",
    ...tests,
  ],
  { stdio: "inherit" }
);

process.exit(result.status ?? 1);
