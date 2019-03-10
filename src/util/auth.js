function auth(myKey, givenKey, c) {
    if(c.public === true) return true
    if (myKey !== null && myKey && myKey !== undefined && givenKey !== myKey && givenKey !== c.admin.key) {
        return false
    } else {
        return true
    }
}
module.exports = auth
