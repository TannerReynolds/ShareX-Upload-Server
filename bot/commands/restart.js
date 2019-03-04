module.exports = {
    command:"restart",
    description: "restart the webserver",
    syntax: "{PREFIX}restart",
    execute:async (_this, msg, args) => {
        msg.channel.createMessage("Restarting...").then(m => {
            process.exit()
        })
    }
  }