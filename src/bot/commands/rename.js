const fs = require('fs');

module.exports = {
    command: 'rn',
    description: 'Rename an upload',
    syntax: '{PREFIX}rn [old fileName], [new file name]',
    execute: async (_this, msg, args) => {
        // eslint-disable-next-line no-useless-escape
        const files = args.join(' ').split(/\, ?/);
        if (!files[0]) return msg.channel.createMessage('Supply a file name');
        if (!files[1]) return msg.channel.createMessage('Supply a new file name');
        const filesDir = `${__dirname}/../../server/uploads`;
        fs.rename(`${filesDir}/${files[0]}`, `${filesDir}/${files[1]}`, err => {
            err
                ? msg.channel.createMessage(`Error renaming file: ${files[0]}\n${err}`)
                : msg.channel.createMessage(`Successfully Renamed File: ${files[1]}`);
        });
    },
};
