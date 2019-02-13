const ShareXAPI = require(`${__dirname}/server/app`);
const c = require(`${__dirname}/config.json`);
const server = new ShareXAPI(c);
process.on('SIGINT', async () => {
  server.log.warning('Gracefully exiting..');
  process.exit();
});
process.on("unhandledRejection", async err => server.log.uncaughtError(err));
process.on("uncaughtException", async err => server.log.uncaughtError(err));