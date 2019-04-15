const fs = require("fs-extra")

async function pupload(req, res) {
    res.setHeader("Content-Type", "text/html");
    let givenPassword = req.body.password
    let givenFileName = req.body.file
    let entry = this.db.get("passwordUploads").find({fileName: givenFileName}).value();
    if(entry.key !== givenPassword) {
        res.statusCode = 401
        res.render("unauthorized")
        return res.end();
    } else {
        filePath = `${__dirname}/../passwordUploads/${entry.fileName}`
        let file = fs.readFileSync(filePath);
            res.set('Content-Type', this.mimeType(entry.fileName));
            res.send(file)
    }
}
module.exports = pupload