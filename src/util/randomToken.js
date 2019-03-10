function randomToken(number) {
    number = parseInt(number)
    let text = ""
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    for (i = 0; i < number; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}
module.exports = randomToken