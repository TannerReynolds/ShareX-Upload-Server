async function main(req, res) {
    res.setHeader("Content-Type", "text/html")
    res.render("index")
    res.end()
}
module.exports = main