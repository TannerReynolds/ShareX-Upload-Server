require('fs')
    .readdirSync(__dirname)
    .map(filename => {
        const moduleName = filename.split('.')[0];
        // eslint-disable-next-line global-require
        exports[moduleName] = require(`${__dirname}/${filename}`);
    });
