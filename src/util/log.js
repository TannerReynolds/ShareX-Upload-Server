const fg = {
    black: "\x1b[30m%s\x1b[0m",
    red: "\x1b[31m%s\x1b[0m",
    green: "\x1b[32m%s\x1b[0m",
    yellow: "\x1b[33m%s\x1b[0m",
    blue: "\x1b[34m%s\x1b[0m",
    magenta: "\x1b[35m%s\x1b[0m",
    cyan: "\x1b[36m%s\x1b[0m",
    white: "\x1b[37m%s\x1b[0m"
}
const bg = {
    black: "\x1b[40m%s\x1b[0m",
    red: "\x1b[41m%s\x1b[0m",
    green: "\x1b[42m%s\x1b[0m",
    yellow: "\x1b[43m%s\x1b[0m",
    blue: "\x1b[44m%s\x1b[0m",
    magenta: "\x1b[45m%s\x1b[0m",
    cyan: "\x1b[46m%s\x1b[0m",
    white: "\x1b[47m%s\x1b[0m"
}
async function uncaughtError(error) {
    console.log(bg.red, `[${timestamp()}] | Uncaught Error`)
    console.log(fg.red, error)
}
async function success(log) {
    console.log(fg.green, `[${timestamp()}] | ${log}`)
}
async function error(error) {
    console.log(bg.red, `[${timestamp()}] | Error`)
    console.log(fg.red, error)
    console.trace("\x1b[31mError\x1b[0m")
}
async function warning(warning) {
    console.log(fg.magenta, `[${timestamp()}] | ${warning}`)
}
async function verbose(log) {
    console.log(fg.blue, `[${timestamp()}] | ${log}`)
}
module.exports = { uncaughtError, success, error, warning, verbose }

function timestamp() {
    let time = new Date();
    return time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })
  }