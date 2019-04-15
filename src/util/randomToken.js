/** Used to generate file names
 * @param {number} number - Number of characters the file name should be
 * @returns {string} String containing file name
 */
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