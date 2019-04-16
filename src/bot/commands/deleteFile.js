const fs = require('fs');

module.exports = {
    command: 'df',
    description: 'Delete a file from your webserver (https://{domain}/{fileName})',
    syntax: '{PREFIX}df [fileName]',
    execute: async (_this, msg, args) => {
        if (!args.join(' ')) return msg.channel.createMessage('No arguments were given');
        const fileName = args.join(' ');
        const filesDir = `${__dirname}/../../server/uploads`;
        fs.unlink(`${filesDir}/${fileName}`, err => {
            err
                ? msg.channel.createMessage(`Error deleting file: ${fileName}\n${err}`)
                : msg.channel.createMessage(`Successfully Deleted File: ${fileName}`);
        });
    },
};
