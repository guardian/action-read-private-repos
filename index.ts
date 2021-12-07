import core from "@actions/core";
import child_process from "child_process";
import fs from "fs";
import crypto from "crypto";
import os from "os";

const home = os.userInfo().homedir;
const sshAgent = "ssh-agent";
const sshAdd = "ssh-add";
const homeSsh = `${home}/.ssh`;

const doStep = (step: () => void, info: string) => {
  core.info(info);
  step();
};

/**
 * Start the SSH agent
 *
 * As part of this, the relevant environment variables are set.
 */
const startSshAgent = () => {
  child_process
    .execFileSync(sshAgent)
    .toString()
    .split("\n")
    .forEach((line) => {
      const matches = /^(SSH_AUTH_SOCK|SSH_AGENT_PID)=(.*); export \1/.exec(
        line
      );

      if (matches && matches.length > 0) {
        core.exportVariable(matches[1], matches[2]);
        core.info(`${matches[1]}=${matches[2]}`);
      }
    });
};

/**
 * Add the private keys
 *
 * Keys are added directly using ssh-add.
 */
const addPrivateKeys = (keys: string) => {
  keys.split(/(?=-----BEGIN)/).forEach((key) => {
    child_process.execFileSync(sshAdd, ["-"], { input: key.trim() + "\n" });
  });

  // Log keys for debugging
  child_process.execFileSync(sshAdd, ["-l"], { stdio: "inherit" });
};

/**
 * Configure deploy keys
 *
 * Deploy keys are tied to a specific repo. And Github SSH will not let you try
 * multiple keys. Therefore, to support multiple keys, for when multiple private
 * repos need to be accessed, we need some way to determine which key to use.
 * This is achieved by requiring that keys are commented with the target repo
 * itself. We can then map git requests to mappings in the SSH config.
 */
const configureDeployKeys = () => {
  child_process
    .execFileSync(sshAdd, ["-L"])
    .toString()
    .split(/\r?\n/)
    .filter((s) => s)
    .forEach((key) => {
      const parts = key.match(/\bgithub\.com[:/]([_.a-z0-9-]+\/[_.a-z0-9-]+)/i);

      if (!parts) {
        core.info(`Parts are: ${key}, ${parts}`);
        core.setFailed(`Required comment for public key '${key}' not found.`);
        return;
      }

      const sha256 = crypto.createHash("sha256").update(key).digest("hex");
      const ownerAndRepo = parts[1].replace(/\.git$/, "");

      fs.writeFileSync(`${homeSsh}/key-${sha256}`, key + "\n", { mode: "600" });

      child_process.execSync(
        `git config --global --replace-all url."git@key-${sha256}.github.com:${ownerAndRepo}".insteadOf "https://github.com/${ownerAndRepo}"`
      );
      child_process.execSync(
        `git config --global --add url."git@key-${sha256}.github.com:${ownerAndRepo}".insteadOf "git@github.com:${ownerAndRepo}"`
      );
      child_process.execSync(
        `git config --global --add url."git@key-${sha256}.github.com:${ownerAndRepo}".insteadOf "ssh://git@github.com/${ownerAndRepo}"`
      );

      const sshConfig =
        `\nHost key-${sha256}.github.com\n` +
        `    HostName github.com\n` +
        `    IdentityFile ${homeSsh}/key-${sha256}\n` +
        `    IdentitiesOnly yes\n`;

      fs.appendFileSync(`${homeSsh}/config`, sshConfig);

      core.info(
        `Added deploy-key mapping: Use identity '${homeSsh}/key-${sha256}' for GitHub repository ${ownerAndRepo}`
      );
    });
};

const main = () => {
  const privateKeys = core.getInput("private-ssh-keys");
  if (!privateKeys) {
    core.setFailed("Required argument ('ssh-private-keys') is empty.");
    return;
  }

  fs.mkdirSync(homeSsh, { recursive: true });

  doStep(startSshAgent, "Starting ssh agent...");
  doStep(addPrivateKeys.bind(undefined, privateKeys), "Adding private keys...");
  doStep(configureDeployKeys, "Configuring deploy keys...");
};

try {
  main();
} catch (e) {
  const error = e as Error;
  core.error(error);
  core.setFailed(error.message);
}
