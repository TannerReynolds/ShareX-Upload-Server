const fs = require('fs-extra');

async function get(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.render('short', { public: this.c.public });
    res.end();
}
async function post(req, res) {
    const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    res.setHeader('Content-Type', 'text/text');
    if (!this.auth(this.c.key, req.body.password, this.c) && !this.c.public) {
        res.statusCode = 401;
        res.redirect('/short?error=Incorrect_Password');
        res.end();
        return this.log.warning(`Unauthorized User | URL Shorten | ${userIP}`);
    }
    const protocol = this.protocol();
    const fileName = this.randomToken(this.c.shortUrlLength);
    if (req.body.URL === '' || req.body.URL === null) {
        res.redirect('/short?error=No URL Input');
        return res.end();
    }
    const stream = fs.createWriteStream(`${__dirname}/../uploads/${fileName}.html`);
    stream.once('open', () => {
        stream.write(`<meta http-equiv="refresh" content="0;URL='${req.body.URL}'" />`);
        stream.end();
        if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[NEW][SHORT URL]\n[URL](${req.body.URL})\n[NEW](${req.headers.host}/${fileName})\n[IP](${userIP})\n\`\`\``);
        this.log.verbose(`New Short URL: ${protocol}://${req.headers.host}/${fileName} | IP: ${userIP}`);
        res.redirect(`/short?success=${protocol}://${req.headers.host}/${fileName}`);
        this.db.get('files')
            .push({ path: `/${fileName}`, ip: userIP, views: 0 })
            .write();
        return res.end();
    });
}
module.exports = { get, post };
