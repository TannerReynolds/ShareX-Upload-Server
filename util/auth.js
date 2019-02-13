function auth(myKey, givenKey) {
    if (myKey !== null && myKey && myKey !== undefined && givenKey !== myKey) {
        return false
    } else {
        return true
    }
}
module.exports = auth
