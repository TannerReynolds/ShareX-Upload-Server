const fg = {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m"
}
const bg = {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m"
}
const endColor = "\x1b[0m"
async function uncaughtError(log) {
    console.log(`${fg.red}  |> ${endColor}${bg.red}[${timestamp()}]${endColor}${fg.red} | ${log}${endColor}`)
}
async function success(log) {
    console.log(`${fg.red}  |> ${endColor}${bg.green}[${timestamp()}]${endColor}${fg.green} | ${log}${endColor}`)
}
async function warning(log) {
    console.log(`${fg.red}  |> ${endColor}${bg.magenta}[${timestamp()}]${endColor}${fg.magenta} | ${log}${endColor}`)
}
async function verbose(log) {
    console.log(`${fg.red}  |> ${endColor}${bg.blue}[${timestamp()}]${endColor}${fg.blue} | ${log}${endColor}`)
}
module.exports = { uncaughtError, success, warning, verbose }

function timestamp() {
    let time = new Date();
    return time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })
  }