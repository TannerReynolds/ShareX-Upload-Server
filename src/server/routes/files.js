/* eslint-disable no-lonely-if */
const formidable = require('formidable');
const fs = require('fs-extra');
const Remarkable = require('remarkable');
const ejs = require('ejs');

const md = new Remarkable('full', {
    html: false,
    linkify: true,
    typographer: true,
});
async function files(req, res) {
    res.setHeader('Content-Type', 'text/text');
    const fileName = this.randomToken(this.c.fileNameLength); // 56,800,235,584 possible file names
    const form = new formidable.IncomingForm();
    const protocol = this.protocol();
    // eslint-disable-next-line no-shadow
    form.parse(req, (err, fields, files) => {
        const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
        let usingUploader = false;
        if (files.fdataUploader && !fields.key) {
            usingUploader = true;
            // eslint-disable-next-line no-param-reassign
            files.fdata = files.fdataUploader;
        }
        if (!this.auth(this.c.key, fields.key, this.c) && usingUploader === false) {
            res.statusCode = 401;
            res.write('Unauthorized');
            res.end();
            return this.log.warning(`Unauthorized User | File Upload | ${userIP}`);
        } if (!this.auth(this.c.key, fields.password, this.c) && usingUploader === true) {
            this.log.warning(this.auth(this.c.key, fields.password, this.c));
            res.statusCode = 401;
            res.redirect('/?error=Incorrect_Password');
            res.end();
            return this.log.warning(`Unauthorized User | File Upload | ${userIP}`);
        }
        const oldpath = files.fdata.path;
        const fileExt = files.fdata.name.substring(files.fdata.name.lastIndexOf('.') + 1, files.fdata.name.length).toLowerCase();
        let newpath;
        fields.pupload
            ? newpath = `${__dirname}/../passwordUploads/${fileName}.${fileExt}`
            : newpath = `${__dirname}/../uploads/${fileName}.${fileExt}`;
        let returnedFileName;
        if (!fileExt.includes('png') && !fileExt.includes('jpg') && !fileExt.includes('jpeg') && !fileExt.includes('md') && !fields.pupload) {
            returnedFileName = `${fileName}.${fileExt}`;
        } else {
            returnedFileName = fileName;
        }
        this.db.get('files')
            .push({
                path: `/${returnedFileName}`,
                ip: userIP,
                views: 0,
            })
            .write();
        let settings;
        fields.key !== this.c.admin.key
            ? settings = this.c
            : settings = this.c.admin;
        if (Math.round((files.fdata.size / 1024) / 1000) > settings.maxUploadSize) {
            if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[FAILED UPLOAD][USER]\n[FILE](${files.fdata.name})\n[SIZE](${Math.round(files.fdata.size / 1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n\n[ERROR](ERR_FILE_TOO_BIG)\`\`\``);
            res.statusCode = 413;
            if (usingUploader === true) {
                res.redirect('/?error=File_Too_Big');
                return res.end();
            }
            res.write(`${protocol}://${req.headers.host}/ERR_FILE_TOO_BIG`);
            return res.end();
        }
        if (!this.c.allowed.includes(fileExt) && fields.key !== this.c.admin.key) {
            if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[FAILED UPLOAD][USER]\n[FILE](${files.fdata.name})\n[SIZE](${Math.round(files.fdata.size / 1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n\n[ERROR](ERR_ILLEGAL_FILE_TYPE)\`\`\``);
            res.statusCode = 415;
            if (usingUploader === true) {
                res.redirect('/?error=Illegal_File_Type');
                return res.end();
            }
            res.write(`${protocol}://${req.headers.host}/ERR_ILLEGAL_FILE_TYPE`);
            return res.end();
        }
        if (fields.pupload) {
            fs.move(oldpath, newpath, () => {
                const puploadKey = fields.pupload;
                this.db.get('passwordUploads')
                    .push({
                        fileName: `${fileName}.${fileExt}`,
                        key: puploadKey,
                    })
                    .write();
                fs.readFile(newpath, 'utf-8', () => {
                    const stream = fs.createWriteStream(`${__dirname}/../uploads/${fileName}.html`);
                    stream.once('open', () => {
                        ejs.renderFile(`${__dirname}/../views/puploadAuth.ejs`, {
                            fileName: `${fileName}.${fileExt}`,
                        }, {}, (_err, str) => {
                            stream.write(str);
                        });
                        stream.end();
                    });
                });
            });
            if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[NEW UPLOAD][USER]\n[SIZE](${Math.round(files.fdata.size / 1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n\`\`\`\n${protocol}://${req.headers.host}/${returnedFileName}`);
            if (err) return res.write(err);
            this.log.verbose(`New File Upload: ${protocol}://${req.headers.host}/${returnedFileName} | IP: ${userIP}`);
            if (usingUploader === true) {
                res.redirect(`/?success=${protocol}://${req.headers.host}/${returnedFileName}`);
                return res.end();
            }
            res.write(`${protocol}://${req.headers.host}/${returnedFileName}`);
            return res.end();
        }
        fs.move(oldpath, newpath, () => {
            if (fileExt.toLowerCase() === 'md' && this.c.markdown) {
                fs.readFile(newpath, 'utf-8', (_readErr, data) => {
                    const stream = fs.createWriteStream(`${__dirname}/../uploads/${fileName}.html`);
                    stream.once('open', () => {
                        ejs.renderFile(`${__dirname}/../views/md.ejs`, {
                            ogDesc: data.match(/.{1,297}/g)[0],
                            mdRender: md.render(data),
                        }, {}, (_renderErr, str) => {
                            stream.write(str);
                        });
                        stream.end();
                        fs.unlink(newpath, delErr => {
                            if (delErr) return this.log.warning(delErr);
                        });
                    });
                });
            }
            if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[NEW UPLOAD][USER]\n[SIZE](${Math.round(files.fdata.size / 1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n\`\`\`\n${protocol}://${req.headers.host}/${returnedFileName}`);
            if (err) return res.write(err);
            this.log.verbose(`New File Upload: ${protocol}://${req.headers.host}/${returnedFileName} | IP: ${userIP}`);
            if (usingUploader === true) {
                res.redirect(`/?success=${protocol}://${req.headers.host}/${returnedFileName}`);
                return res.end();
            }
            res.write(`${protocol}://${req.headers.host}/${returnedFileName}`);
            return res.end();
        });
    });
}
module.exports = files;
