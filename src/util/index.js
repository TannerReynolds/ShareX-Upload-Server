require('fs')
  .readdirSync(__dirname)
  .map(filename => {
    const moduleName = filename.split('.')[0];
    exports[moduleName] = require(`${__dirname}/${filename}`);
  });
