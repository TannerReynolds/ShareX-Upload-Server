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
    if (!this.auth(password, req.body.password, this.c)) {
        res.statusCode = 401;
        res.render('unauthorized');
        res.end();
        return this.log.warning(`Unauthorized User | Gallery Access | ${userIP} | ${req.body.password}`);
    }
    this.log.warning(`IP Address: ${userIP} successfully accessed gallery with key ${req.body.password}`);
    if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[GALLERY ACCESS][USER]\n[IP](${userIP})\n[KEY](${req.body.password})\n\`\`\``);
    const pics = [];
    fs.readdir(`${__dirname}/../uploads`, function(err, files){
        files = files.map(function (fileName) {
          return {
            name: fileName,
            time: fs.statSync(`${__dirname}/../uploads/${fileName}`).mtime.getTime()
          };
        })
        files.sort(function (a, b) {
          return b.time - a.time; });
        files = files.map(function (v) {
          return v.name; });
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
        })
      }); 
      
}
module.exports = { get, post };
