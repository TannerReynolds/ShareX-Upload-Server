const path = require("path")
const formidable = require("formidable")
const fs = require("fs-extra")
const Remarkable = require("remarkable")
const ejs = require("ejs")
const md = new Remarkable("full", {
    html: false,
    linkify: true,
    typographer: true
})
async function files(req, res) {
    res.setHeader("Content-Type", "text/text")
    let fileName = this.randomToken(this.c.fileNameLength) // 56,800,235,584 possible file names
    let form = new formidable.IncomingForm()
    let protocol = this.protocol()
    form.parse(req, (err, fields, files) => {
        let userIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress
        let usingUploader = false
        if(files.fdataUploader && !fields.key) {
            usingUploader = true
            files.fdata = files.fdataUploader
        }
        if (!this.auth(this.c.key, fields.key, this.c) && usingUploader === false) {
            res.statusCode = 401
            res.write("Unauthorized");
            res.end();
            return this.log.warning(`Unauthorized User | File Upload | ${userIP}`)
        } else if(!this.auth(this.c.key, fields.password, this.c) && usingUploader === true) {
            this.log.warning(this.auth(this.c.key, fields.password, this.c))
            res.statusCode = 401
            res.redirect("/?error=Incorrect_Password")
            res.end()
            return this.log.warning(`Unauthorized User | File Upload | ${userIP}`)
        }
        let oldpath = files.fdata.path
        let fileExt = files.fdata.name.substring(files.fdata.name.lastIndexOf(".") + 1, files.fdata.name.length).toLowerCase()
        let newpath = `${__dirname}/../uploads/${fileName}.${fileExt}`
        let returnedFileName
        if(!fileExt.includes("png") && !fileExt.includes("jpg") && !fileExt.includes("jpeg") && !fileExt.includes("md")) {
            returnedFileName = `${fileName}.${fileExt}`
        } else {
            returnedFileName = fileName
        }
        this.db.get("files")
            .push({path: `/${returnedFileName}`, ip: userIP, views: 0})
            .write();
        if (fields.key === this.c.admin.key) {
            if (Math.round((files.fdata.size / 1024) / 1000) > this.c.admin.maxUploadSize) {
                if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[FAILED UPLOAD][ADMIN]\n[FILE](${files.fdata.name})\n[SIZE](${Math.round(files.fdata.size/1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n\n[ERROR](ERR_FILE_TOO_BIG)\`\`\``)
                res.statusCode = 413
                if(usingUploader === true) {
                    res.redirect("/?error=File_Too_Big")
                    return res.end()
                } else {
                    res.write(`${protocol}://${req.headers.host}/ERR_FILE_TOO_BIG`)
                    return res.end()
                }
            } else {
                fs.move(oldpath, newpath, err => {
                    if (fileExt.toLowerCase() === "md" && this.c.markdown) {
                        fs.readFile(newpath, "utf-8", function read(err, data) {
                            let stream = fs.createWriteStream(`${__dirname}/../uploads/${fileName}.html`)
                            stream.once("open", fd => {
                                ejs.renderFile(`${__dirname}/../views/md.ejs`, {
                                    ogDesc: data.match(/.{1,297}/g)[0],
                                    mdRender: md.render(data)
                                }, {}, (err, str) => {
                                    stream.write(str)
                                })
                                stream.end()
                                fs.unlink(newpath, err => {
                                    if (err) return this.log.warning(err)
                                });
                            })
                        })
                    }
                    if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[NEW UPLOAD][ADMIN]\n[SIZE](${Math.round(files.fdata.size/1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\`\`\`\n${protocol}://${req.headers.host}/${returnedFileName}`)
                    if (err) return res.write(err)
                    this.log.verbose(`New File Upload: ${protocol}://${req.headers.host}/${returnedFileName} | IP: ${userIP}`)
                    if(usingUploader === true) {
                        res.redirect(`/?success=${protocol}://${req.headers.host}/${returnedFileName}`)
                        return res.end()
                    } else {
                        res.write(`${protocol}://${req.headers.host}/${returnedFileName}`)
                        return res.end()
                    }
                })
            }
        } else {
            if (Math.round((files.fdata.size / 1024) / 1000) > this.c.maxUploadSize) {
                if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[FAILED UPLOAD][USER]\n[FILE](${files.fdata.name})\n[SIZE](${Math.round(files.fdata.size/1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n\n[ERROR](ERR_FILE_TOO_BIG)\`\`\``)
                res.statusCode = 413
                if(usingUploader === true) {
                    res.redirect("/?error=File_Too_Big")
                    return res.end()
                } else {
                    res.write(`${protocol}://${req.headers.host}/ERR_FILE_TOO_BIG`)
                    return res.end()
                }
            } else {
                if (!this.c.allowed.includes(fileExt)) {
                    if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[FAILED UPLOAD][USER]\n[FILE](${files.fdata.name})\n[SIZE](${Math.round(files.fdata.size / 1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n\n[ERROR](ERR_ILLEGAL_FILE_TYPE)\`\`\``)
                    res.statusCode = 415
                    if(usingUploader === true) {
                        res.redirect("/?error=Illegal_File_Type")
                        return res.end()
                    } else {
                        res.write(`${protocol}://${req.headers.host}/ERR_ILLEGAL_FILE_TYPE`)
                        return res.end()
                    }
                } else {
                    fs.move(oldpath, newpath, err => {
                        if (fileExt.toLowerCase() === "md" && this.c.markdown) {
                            fs.readFile(newpath, "utf-8", function read(err, data) {
                                let stream = fs.createWriteStream(`${__dirname}/../uploads/${fileName}.html`)
                                stream.once("open", fd => {
                                    ejs.renderFile(`${__dirname}/../views/md.ejs`, {
                                        ogDesc: data.match(/.{1,297}/g)[0],
                                        mdRender: md.render(data)
                                    }, {}, (err, str) => {
                                        stream.write(str)
                                    })
                                    stream.end()
                                    fs.unlink(newpath, err => {
                                        if (err) return this.log.warning(err)
                                    });
                                })
                            })
                        }
                        if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[NEW UPLOAD][USER]\n[SIZE](${Math.round(files.fdata.size/1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n\`\`\`\n${protocol}://${req.headers.host}/${returnedFileName}`)
                        if (err) return res.write(err)
                        this.log.verbose(`New File Upload: ${protocol}://${req.headers.host}/${returnedFileName} | IP: ${userIP}`)
                        if(usingUploader === true) {
                            res.redirect(`/?success=${protocol}://${req.headers.host}/${returnedFileName}`)
                            return res.end()
                        } else {
                            res.write(`${protocol}://${req.headers.host}/${returnedFileName}`)
                            return res.end()
                        }
                    })
                }
            }
        }
    })
} 
module.exports = files