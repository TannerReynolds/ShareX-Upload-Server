async function illegalFileType(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.statusCode = 413;
    res.render('ERR_FILE_TOO_BIG', { title: this.c.title });
    res.end();
}
module.exports = illegalFileType;
