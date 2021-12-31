async function illegalFileType(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.statusCode = 413;
    res.render('ERR_ILLEGAL_FILE_TYPE');
    res.end();
}
module.exports = illegalFileType;
