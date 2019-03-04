async function upload(req, res) {
    res.setHeader("Content-Type", "text/html")
    res.statusCode = 200
    res.render("upload")
    res.end()
}
module.exports = upload