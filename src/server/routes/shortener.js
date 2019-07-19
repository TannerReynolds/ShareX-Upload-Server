/* eslint-disable no-useless-escape */
const formidable = require('formidable');
const fs = require('fs-extra');

async function shortener(req, res) {
    const form = new formidable.IncomingForm();
    // eslint-disable-next-line no-unused-vars
    form.parse(req, (_err, fields, _files) => {
        const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
        const protocol = this.protocol();
        if (!this.auth(this.c.key, fields.key, this.c)) {
            res.statusCode = 401;
            res.write('Unauthorized');
            res.end();
            return this.log.warning(`Unauthorized User | File Upload | ${userIP}`);
        }
        const fileName = this.randomToken(4); // 14,776,336 possible file names
        const url = req.headers.url;
        if (url == null) {
            res.send('NO_URL_PROVIDED');
            return res.end();
        }
        if (!/([-a-zA-Z0-9^\p{L}\p{C}\u00a1-\uffff@:%_\+.~#?&//=]{2,256}){1}(\.[a-z]{2,4}){1}(\:[0-9]*)?(\/[-a-zA-Z0-9\u00a1-\uffff\(\)@:%,_\+.~#?&//=]*)?([-a-zA-Z0-9\(\)@:%,_\+.~#?&//=]*)?/.test(url.toLowerCase().toString())) {
            res.send('NOT_A_VALID_URL');
            return res.end();
        }
        const stream = fs.createWriteStream(`${__dirname}/../uploads/${fileName}.html`);
        stream.once('open', () => {
            stream.write(`<meta http-equiv="refresh" content="0; url=${url}" />`);
            stream.end();
            if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[NEW][SHORT URL]\n[URL](${url})\n[NEW](${req.headers.host}/${fileName})\n[IP](${userIP})\n\`\`\``);
            this.log.verbose(`New Short URL: ${protocol}://${req.headers.host}/${fileName} | IP: ${userIP}`);
            res.write(`${protocol}://${req.headers.host}/${fileName}`);
            this.db.get('files')
                .push({ path: `/${fileName}`, ip: userIP, views: 0 })
                .write();
            return res.end();
        });
    });
}
module.exports = shortener;
