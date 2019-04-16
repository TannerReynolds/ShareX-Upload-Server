module.exports = {
    command: 'banip',
    description: 'Ban an IP Address from your service',
    syntax: '{PREFIX}banip [IP_ADDRESS]',
    execute: async (_this, msg, args) => {
        if (!args.join(' ')) return msg.channel.createMessage('No arguments were given');
        const ipAddress = args.join(' ');
        const exists = _this.db.get('bans').find({ ip: ipAddress }).value();
        if (exists === undefined) {
            msg.channel.createMessage(`Banning IP \`${ipAddress}\`...`);
            _this.db.get('bans')
                .push({ ip: ipAddress })
                .write();
        } else {
            msg.channel.createMessage('This IP Address is already banned');
        }
    },
};
