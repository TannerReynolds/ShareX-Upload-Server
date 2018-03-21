module.exports = {
    command:"help",
    description: "Get info on commands",
    syntax: "{PREFIX}help",
    execute:async (bot, msg, args, commands, prefix) => {
        let cmds = [];
        commands.map(cmd => {
            cmds.push(`[${cmd.command}]: ${cmd.syntax.replace("{PREFIX}", prefix)} | ${cmd.description}`)
        })
        msg.channel.createMessage(`Here is a list of available commands\n\`\`\`ini\n${cmds.join("\n")}\n\`\`\``)
    }
  }