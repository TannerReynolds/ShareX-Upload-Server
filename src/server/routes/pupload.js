const fs = require('fs-extra');

async function pupload(req, res) {
    res.setHeader('Content-Type', 'text/html');
    const givenPassword = req.body.password;
    const givenFileName = req.body.file;
    const entry = this.db.get('passwordUploads').find({ fileName: givenFileName }).value();
    if (entry.key !== givenPassword) {
        res.statusCode = 401;
        res.render('unauthorized');
        return res.end();
    }
    const filePath = `${__dirname}/../passwordUploads/${entry.fileName}`;
    const file = fs.readFileSync(filePath);
    res.set('Content-Type', this.mimeType(entry.fileName));
    res.send(file);
}
module.exports = pupload;
