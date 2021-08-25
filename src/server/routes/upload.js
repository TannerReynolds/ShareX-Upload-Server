async function upload(_req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.statusCode = 200;
    res.render('upload', { public: this.c.public, title: this.c.title });
}
module.exports = upload;
