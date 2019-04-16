const { exec } = require('child_process');

module.exports = {
    command: 'exec',
    description: 'execute terminal commands from Discord',
    syntax: '{PREFIX}exec [cmds]',
    execute: async (_this, msg, args) => {
        if (!args.join(' ')) return msg.channel.createMessage('No arguments were given');
        msg.channel.createMessage(`\`INPUT\`\n\`\`\`ini\n${args.join(' ')}\n\`\`\``);
        exec(args.join(' '), (error, stdout) => {
            if (error) {
                msg.channel.createMessage(`\`ERROR\`\n\`\`\`ini\n${error}\n\`\`\``);
            } else {
                msg.channel.createMessage(`\`OUTPUT\`\n\`\`\`ini\n${stdout}\n\`\`\``);
            }
        });
    },
};
