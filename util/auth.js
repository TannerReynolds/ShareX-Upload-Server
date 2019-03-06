const c = require(`${__dirname}/../config.json`)
function auth(myKey, givenKey) {
    if (myKey !== null && myKey && myKey !== undefined && givenKey !== myKey && givenKey !== c.admin.key) {
        return false
    } else {
        return true
    }
}
module.exports = auth
