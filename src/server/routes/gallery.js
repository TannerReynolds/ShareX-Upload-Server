const fs = require('fs-extra');

async function get(_req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.render('galleryLogin');
    res.end();
}
async function post(req, res) {
    const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    res.setHeader('Content-Type', 'text/html');
    const protocol = this.protocol();
    const password = this.c.admin.key;
    if (!this.auth(password, req.body.password, { public: false, admin: { key: this.c.admin.key } })) {
        res.statusCode = 401;
        res.render('unauthorized');
        res.end();
        return this.log.warning(`Unauthorized User | File Upload | ${userIP}`);
    }
    this.log.warning(`IP Address: ${userIP} successfully accessed gallery`);
    const pics = [];
    fs.readdir(`${__dirname}/../uploads`, (err, files) => {
        files.forEach((file, idx, array) => {
            if (file.toString().includes('.jpg') || file.toString().includes('.png') || file.toString().includes('.gif')) {
                pics.push(`${protocol}://${req.headers.host}/${file.toString()}`);
                if (idx === array.length - 1) {
                    res.render('gallery', {
                        pictures: pics,
                    });
                    return res.end();
                }
            }
        });
    });
}
module.exports = { get, post };
