module.exports = {
    command: 'restart',
    description: 'restart the webserver',
    syntax: '{PREFIX}restart',
    execute: async (_this, msg) => {
        msg.channel.createMessage('Restarting...').then(() => {
            process.exit();
        });
    },
};
