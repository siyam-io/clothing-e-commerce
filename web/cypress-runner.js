const { spawn } = require("child_process");

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const args = process.argv.slice(2);
const cmd = process.platform === "win32" ? "npx.cmd" : "npx";

const cp = spawn(cmd, ["cypress", ...args], {
  stdio: "inherit",
  env,
  shell: true,
});

cp.on("exit", (code) => {
  process.exit(code || 0);
});

