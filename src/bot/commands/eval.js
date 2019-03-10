module.exports = {
    command: "eval",
    description: "evaluate and execute javascript",
    syntax: "{PREFIX}eval [code]",
    execute: async (_this, msg, args) => {
        String.prototype.charLimitSplit = number => {
            if (typeof number !== "number") {
                number = parseInt(number);
            }
            let newSplit = [];
            if (this.length > number) {
                let splitRegex = new RegExp(`.{1,${number}}`, "g")
                let splitStr = this.match(splitRegex);
                for (let i = 0; i < splitStr.length; i++) {
                    newSplit.push(splitStr[i])
                }
                return newSplit;
            }
        }
        let code = args.join(" ");
        try {
            let evaled = eval(code);
            if (typeof evaled !== "string") evaled = require("util").inspect(evaled, {
                breakLength: Infinity
            });
            if (evaled.length > 1000) {
                let output = clean(evaled).charLimitSplit(1000);
                return success(code, output[0])
            } else {
                return success(code, clean(evaled))
            }
        } catch (err) {
            if (err.length > 1000) {
                let errorSplit = err.charLimitSplit(1000);
                return error(code, errorSplit)
            } else {
                return error(code, clean(err))
            }
        }
        async function success(input, output) {
            msg.channel.createMessage({
                embed: {
                    color: 0x36393E,
                    fields: [{
                        name: "Input",
                        value: `\`\`\`JS\n${input}\`\`\``
                    }, {
                        name: "Output",
                        value: `\`\`\`JS\n${output} | ... |\`\`\``
                    }]
                }
            });
        }
        async function error(input, output) {
            msg.channel.createMessage({
                embed: {
                    color: 0x36393E,
                    fields: [{
                        name: "Input",
                        value: `\`\`\`JS\n${input}\`\`\``
                    }, {
                        name: "Error Output",
                        value: `\`\`\`JS\n${output}\`\`\``
                    }]
                }
            });
        }
        function clean(text) {
            if (typeof(text) === "string") {
                text = text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
                let tokenObj = new RegExp(`${Buffer.from(_this.bot.user.id).toString("base64")}\\S+(?="|'|\`)`, "gm")
                let tokenRaw = new RegExp(`${Buffer.from(_this.bot.user.id).toString("base64")}\\S+`, "gm")
                if(text.match(tokenObj)) {
                    text = text.replace(tokenObj, "Token Cleaned")
                    return text
                } else if(text.match(tokenRaw)) {
                    text = text.replace(tokenRaw, "Token Cleaned")
                    return text
                } else {
                    return text
                }
            }
            else return text
        }
    }
}