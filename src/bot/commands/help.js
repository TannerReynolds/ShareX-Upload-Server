module.exports = {
    command: 'help',
    description: 'Get info on commands',
    syntax: '{PREFIX}help',
    execute: async (_this, msg) => {
        const cmds = [];
        _this.commands.map(cmd => {
            cmds.push(`[${cmd.command}]: ${cmd.syntax.replace('{PREFIX}', _this.c.prefix)} | ${cmd.description}`);
        });
        msg.channel.createMessage(`Here is a list of available commands\n\`\`\`ini\n${cmds.join('\n')}\n\`\`\``);
    },
};
