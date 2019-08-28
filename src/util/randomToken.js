/** Used to generate file names
 * @param {number} number - Number of characters the file name should be
 * @returns {string} String containing file name
 */
function randomToken(number, symbols) {
    // eslint-disable-next-line no-param-reassign
    number = parseInt(number, 10);
    let text = '';
    let possible
    if(symbols !== true) {
        possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    } else {
        possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%^&*()-_=+[]{}|;:/?><,.';
    }
    for (let i = 0; i < number; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
module.exports = randomToken;
