function auth(myKey, givenKey, c) {
    if (c.public === true) return true;
    if (myKey !== null && givenKey !== myKey && givenKey !== c.admin.key) {
        return false;
    }
    return true;
}
module.exports = auth;
