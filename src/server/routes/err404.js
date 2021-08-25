async function err404(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.statusCode = 404;
    res.render('404', { title: this.c.title });
    res.end();
}
module.exports = err404;
