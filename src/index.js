/* eslint-disable global-require */
/* eslint-disable no-console */
const ShareXAPI = require(`${__dirname}/server/app`);
/** Setting definitions for the config file and server class */
let c;
let server;
console.log(`\x1b[31m
  ======================================================================
  |\x1b[0m\x1b[34m  ________  ___  ___  ________  ________  _______   ________        \x1b[0m\x1b[31m|
  |\x1b[0m\x1b[34m |\\   ____\\|\\  \\|\\  \\|\\   __  \\|\\   __  \\|\\  ___ \\ |\\   ____\\       \x1b[0m\x1b[31m|
  |\x1b[0m\x1b[34m \\ \\  \\___|\\ \\  \\\\\\  \\ \\  \\|\\  \\ \\  \\|\\  \\ \\   __/|\\ \\  \\___|_      \x1b[0m\x1b[31m|
  |\x1b[0m\x1b[34m  \\ \\_____  \\ \\   __  \\ \\   __  \\ \\   _  _\\ \\  \\_|/_\\ \\_____  \\     \x1b[0m\x1b[31m|
  |\x1b[0m\x1b[34m   \\|____|\\  \\ \\  \\ \\  \\ \\  \\ \\  \\ \\  \\\\  \\\\ \\  \\_|\\ \\|____|\\  \\    \x1b[0m\x1b[31m|
  |\x1b[0m\x1b[34m     ____\\_\\  \\ \\__\\ \\__\\ \\__\\ \\__\\ \\__\\\\ _\\\\ \\_______\\____\\_\\  \\   \x1b[0m\x1b[31m|
  |\x1b[0m\x1b[34m    |\\_________\\|__|\\|__|\\|__|\\|__|\\|__|\\|__|\\|_______|\\_________\\  \x1b[0m\x1b[31m|
  |\x1b[0m\x1b[34m    \\|_________|                                      \\|_________|  \x1b[0m\x1b[31m|
  |                                                                    |
  |                                                                    |
  ======================================================================
  |\x1b[0m\x1b[32m  Creator: github.com/TannerReynolds\x1b[0m\x1b[31m                                |
  |\x1b[0m\x1b[32m  Discord: https://discord.gg/QTcU89d\x1b[0m\x1b[31m                               |
  ======================================================================\x1b[0m`);

/** Determines whether or not to use the test config or not.
 * Test env config does not get pushed to git
 * @returns {void}
 */
async function loadConfig() {
    process.argv[2] === '-test'
        ? c = require(`${__dirname}/config.real.json`)
        : c = require(`${__dirname}/config.json`);
}

loadConfig().then(() => {
    /** Starting server using the selected config file */
    server = new ShareXAPI(c);
});
process.on('SIGINT', async () => {
    server.log.warning('Gracefully exiting..');
    process.exit();
});

process.on('unhandledRejection', async err => server.log.uncaughtError(err.stack));
process.on('uncaughtException', async err => server.log.uncaughtError(err.stack));
