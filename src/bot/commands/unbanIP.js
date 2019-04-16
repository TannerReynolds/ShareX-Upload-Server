module.exports = {
    command: 'unbanip',
    description: 'Unban an IP Address from your service',
    syntax: '{PREFIX}unbanip [IP_ADDRESS]',
    execute: async (_this, msg, args) => {
        if (!args.join(' ')) return msg.channel.createMessage('No arguments were given');
        const ipAddress = args.join(' ');
        const exists = _this.db.get('bans').find({ ip: ipAddress }).value();
        if (exists === undefined) {
            msg.channel.createMessage('This IP Address is not banned');
        } else {
            msg.channel.createMessage(`Removing ban for IP \`${ipAddress}\`...`);
            _this.db.get('bans')
                .remove({ ip: ipAddress })
                .write();
        }
    },
};
