const ShareXAPI = require(`${__dirname}/server/app`);
let c
let server
loadConfig().then(() => {
  server = new ShareXAPI(c);
})
process.on("SIGINT", async () => {
  server.log.warning('Gracefully exiting..');
  process.exit();
});
async function loadConfig() {
  process.argv[2] === "-test" 
      ? c = require(`${__dirname}/config.real.json`)
      : c = require(`${__dirname}/config.json`)
}
process.on("unhandledRejection", async err => server.log.uncaughtError(err.stack));
process.on("uncaughtException", async err => server.log.uncaughtError(err.stack));