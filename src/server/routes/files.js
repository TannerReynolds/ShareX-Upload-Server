/* eslint-disable no-lonely-if */
const formidable = require('formidable');
const fs = require('fs-extra');
const { Remarkable } = require('remarkable');
const ejs = require('ejs');
const exif = require('exif2');

const md = new Remarkable('full', {
    html: false,
    linkify: true,
    typographer: true,
});
async function files(req, res) {
    res.setHeader('Content-Type', 'text/text');
    const fileName = this.randomToken(this.c.fileNameLength, false);
    const form = new formidable.IncomingForm();
    const protocol = this.protocol();
    // eslint-disable-next-line no-shadow
    form.parse(req, (err, fields, files) => {
        let userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress.split(",")[0]; userIP = userIP.split(",")[0];
        const authKey = fields.key;
        let usingUploader = false;
        if (files.fdataUploader && !fields.key) {
            usingUploader = true;
            // eslint-disable-next-line no-param-reassign
            files.fdata = files.fdataUploader;
        }
        if (files.file) {
            files.fdata = files.file;
        }
        if (!this.auth(this.c.key, fields.key, this.c) && usingUploader === false) {
            res.statusCode = 401;
            res.write('Unauthorized');
            res.end();
            return this.log.warning(`Unauthorized User | File Upload | ${userIP} | ${authKey}`);
        } if (!this.auth(this.c.key, fields.password, this.c) && usingUploader === true) {
            this.log.warning(this.auth(this.c.key, fields.password, this.c));
            res.statusCode = 401;
            res.redirect('/?error=Incorrect_Password');
            res.end();
            return this.log.warning(`Unauthorized User | File Upload | ${userIP} | ${authKey}`);
        }
        const oldpath = files.fdata.path;
        const fileExt = files.fdata.name.substring(files.fdata.name.lastIndexOf('.') + 1, files.fdata.name.length).toLowerCase();
        let newpath;
        if(this.c.dateURLPath === true) {
            let currentMonth = getDate('month')
            let currentYear = getDate('year')
            let currentDay = getDate('day')
            let baseDir = `${__dirname}/../uploads/`
            let basePWDir = `${__dirname}/../passwordUploads/`
            fs.access(`${baseDir}${currentYear}/${currentMonth}/${currentDay}`, err => {
                if (err && err.code === 'ENOENT') {
                    fs.mkdirSync(`${baseDir}${currentYear}`);
                    fs.mkdirSync(`${baseDir}${currentYear}/${currentMonth}`);
                    fs.mkdirSync(`${baseDir}${currentYear}/${currentMonth}/${currentDay}`)
                }
            });
            fs.access(`${basePWDir}${currentYear}/${currentMonth}/${currentDay}`, err => {
                if (err && err.code === 'ENOENT') {
                    fs.mkdirSync(`${basePWDir}${currentYear}`);
                    fs.mkdirSync(`${basePWDir}${currentYear}/${currentMonth}`);
                    fs.mkdirSync(`${basePWDir}${currentYear}/${currentMonth}/${currentDay}`)
                }
            });
        }
        fields.pupload
            ? newpath = `${__dirname}/../passwordUploads/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${fileName}.${fileExt}`
            : newpath = `${__dirname}/../uploads/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${fileName}.${fileExt}`;
        let returnedFileName;
        if (!fileExt.includes('png') && !fileExt.includes('jpg') && !fileExt.includes('jpeg') && !fileExt.includes('md') && !fields.pupload) {
            returnedFileName = `${fileName}.${fileExt}`;
        } else {
            returnedFileName = fileName;
        }
        if(fields.showCase) {
            fields.showCase = true
        }
        let showCaseFile;
        if(fields.showCase !== false) {
            showCaseFile = this.randomToken(this.c.fileNameLength, false);
        }
        this.db.get('files')
            .push({
                path: fields.showCase ? `/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${showCaseFile}` : `/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${returnedFileName}`,
                ip: userIP,
                views: 0,
                original: newpath,
                showCase: fields.showCase ? true : false
            })
            .write();
        let settings;
        let isAdmin = false;
        if (!this.c.admin.key.includes(fields.key)) {
            settings = this.c;
        } else {
            settings = this.c.admin;
            isAdmin = true;
        }
        if (Math.round((files.fdata.size / 1024) / 1000) > settings.maxUploadSize && !isAdmin) {
            if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[FAILED UPLOAD][USER]\n[FILE](${files.fdata.name})\n[SIZE](${Math.round(files.fdata.size / 1024)}KB)\n[TYPE](${files.fdata.type})\n[KEY](${authKey})\n[IP](${userIP})\n\n[ERROR](ERR_FILE_TOO_BIG)\`\`\``);
            res.statusCode = 413;
            if (usingUploader === true) {
                res.redirect('/?error=File_Too_Big');
                return res.end();
            }
            res.write(`${protocol}://${req.headers.host}/ERR_FILE_TOO_BIG`);
            return res.end();
        }
        if (!settings.allowed.some(ext => fileExt.endsWith(ext)) && !settings.allowed.includes("*")) {
            if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[FAILED UPLOAD][USER]\n[FILE](${files.fdata.name})\n[SIZE](${Math.round(files.fdata.size / 1024)}KB)\n[TYPE](${files.fdata.type})\n[KEY](${authKey})\n[IP](${userIP})\n\n[ERROR](ERR_ILLEGAL_FILE_TYPE)\`\`\``); 
            res.statusCode = 415;
            if (usingUploader === true) {
                res.redirect('/?error=Illegal_File_Type');
                return res.end();
            }
            res.write(`${protocol}://${req.headers.host}/ERR_ILLEGAL_FILE_TYPE`);
            return res.end();
        }
        if (fields.pupload) {
            let altKey = this.randomToken(this.c.puploadKeyGenLength, true);
            fs.move(oldpath, newpath, () => {
                let puploadKey
                if(fields.pupload === '*random*') {
                    puploadKey = altKey;
                } else {
                    puploadKey = fields.pupload;
                }
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
            if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[NEW UPLOAD][USER]\n[SIZE](${Math.round(files.fdata.size / 1024)}KB)\n[TYPE](${files.fdata.type})\n[KEY](${authKey})\n[IP](${userIP})\n\`\`\`\n${protocol}://${req.headers.host}/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${returnedFileName}`);
            if (err) return res.write(err);
            this.log.verbose(`New File Upload: ${protocol}://${req.headers.host}/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${returnedFileName} | IP: ${userIP} | KEY: ${authKey}`);
            if (usingUploader === true) {
                res.redirect(`/?success=${protocol}://${req.headers.host}/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${returnedFileName}`);
                return res.end();
            }
            fields.pupload === '*random*' ? res.write(`URL: ${protocol}://${req.headers.host}/${returnedFileName} | KEY: ${altKey}`) : res.write(`${protocol}://${req.headers.host}/${returnedFileName}`);
            return res.end();
        }
        if (fields.showCase === true) {
            if(fileExt === "png" || fileExt === "jpg" || fileExt === "gif" || fileExt === "jpeg") {
                returnedFileName = `${showCaseFile}.html`
                fs.move(oldpath, newpath, () => {
                    fs.readFile(newpath, 'utf-8', (err, data) => {
                        exif(newpath, (err, obj) => {
                            if(!obj['camera model name']) obj['camera model name'] = "N/A";
                            if(!obj['f number']) obj['f number'] = "N/A";
                            if(!obj['exposure time']) obj['exposure time'] = "N/A";
                            if(!obj['iso']) obj['iso'] = "N/A";
                            if(!obj['focal length']) obj['focal length'] = "N/A";
                            if(!obj['image size']) obj['image size'] = "N/A";
                            if(!obj['lens id']) obj['lens id'] = "N/A";
                            let camera = obj['camera model name'].replace(/<|>|&lt;|&gt;/gm, "")
                            let fstop = `f/${obj['f number']}`.replace(/<|>|&lt;|&gt;/gm, "")
                            let shutter = obj['exposure time'].replace(/<|>|&lt;|&gt;/gm, "")
                            let iso = obj['iso'].replace(/<|>|&lt;|&gt;/gm, "")
                            let focal = obj['focal length'].replace(/<|>|&lt;|&gt;/gm, "")
                            let dims = obj['image size'].replace(/<|>|&lt;|&gt;/gm, "")
                            let lens = obj['lens id'].replace(/<|>|&lt;|&gt;/gm, "")
                            let width = parseInt(dims.split('x')[0]);
                            let height = parseInt(dims.split('x')[1]);
                            if(height > 700) {
                                let magicNumber = height / 700;
                                height = height / magicNumber;
                                width = width / magicNumber
                            }
                            let sizing = [width, height]
                            const stream = fs.createWriteStream(`${__dirname}/../uploads/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${showCaseFile}.html`);
                            stream.once('open', () => {
                                ejs.renderFile(`${__dirname}/../views/photoShowCase.ejs`, {
                                    camera: camera,
                                    fstop, fstop,
                                    shutter, shutter,
                                    iso: iso,
                                    focal: focal,
                                    dims: dims,
                                    lens: lens,
                                    width: sizing[0],
                                    height: sizing[1],
                                    filename: `${protocol}://${req.headers.host}/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${fileName}.${fileExt}`
                                }, {}, (_err, str) => {
                                    stream.write(str);
                                });
                                stream.end();
                            });
                        });
                    });
                });
                if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[NEW UPLOAD][USER]\n[SIZE](${Math.round(files.fdata.size / 1024)}KB)\n[TYPE](${files.fdata.type})\n[KEY](${authKey})\n[IP](${userIP})\n\`\`\`\n${protocol}://${req.headers.host}/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${showCaseFile}`);
                if (err) return res.write(err);
                this.log.verbose(`New File Upload: ${protocol}://${req.headers.host}/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${showCaseFile} | IP: ${userIP} | KEY ${authKey}`);
                if (usingUploader === true) {
                    res.redirect(`/?success=${protocol}://${req.headers.host}/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${showCaseFile}`);
                    return res.end();
                }
                res.write(`${protocol}://${req.headers.host}/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${showCaseFile}`);
                return res.end();
            }
        }
        fs.move(oldpath, newpath, () => {
            if (fileExt.toLowerCase() === 'md' && this.c.markdown) {
                fs.readFile(newpath, 'utf-8', (_readErr, data) => {
                    const stream = fs.createWriteStream(`${__dirname}/../uploads/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${fileName}.html`);
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
            if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[NEW UPLOAD][USER]\n[SIZE](${Math.round(files.fdata.size / 1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n[KEY](${authKey})\n\`\`\`\n${protocol}://${req.headers.host}/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${returnedFileName}`);
            if (err) return res.write(err);
            this.log.verbose(`New File Upload: ${protocol}://${req.headers.host}/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${returnedFileName} | IP: ${userIP} | KEY: ${authKey}`);
            if (usingUploader === true) {
                res.redirect(`/?success=${protocol}://${req.headers.host}/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${returnedFileName}`);
                return res.end();
            }
            res.write(`${protocol}://${req.headers.host}/${this.c.dateURLPath === true ? `${getDate('year')}/${getDate('month')}/${getDate('day')}/`: ""}${returnedFileName}`);
            return res.end();
        });
    });
}
//const currentMonth = date.getMonth() + 1;
function getDate(type) {
    if(type.toLowerCase() === 'year') {
        const date = new Date();
        const currentYear = date.getFullYear();
        return currentYear;
    }
    if(type.toLowerCase() === 'month') {
        const date = new Date();
        let currentMonth = `${date.getMonth() + 1}`;
        if(currentMonth.length === 1) currentMonth = `0${currentMonth}`
        return currentMonth;
    }
    if(type.toLowerCase() === 'day') {
        const date = new Date();
        let currentDay = `${date.getDate()}`;
        if(currentDay.length === 1) currentDay = `0${currentDay}`;
        return currentDay;
    }
}
module.exports = files;
