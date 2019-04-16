/* eslint-disable no-param-reassign */
/* eslint-disable global-require */
/* eslint-disable no-extend-native */
/* eslint-disable no-eval */
module.exports = {
    command: 'eval',
    description: 'evaluate and execute javascript',
    syntax: '{PREFIX}eval [code]',
    execute: async (_this, msg, args) => {
        String.prototype.charLimitSplit = number => {
            if (typeof number !== 'number') {
                // eslint-disable-next-line no-param-reassign
                number = parseInt(number, 10);
            }
            const newSplit = [];
            if (this.length > number) {
                const splitRegex = new RegExp(`.{1,${number}}`, 'g');
                const splitStr = this.match(splitRegex);
                for (let i = 0; i < splitStr.length; i++) {
                    newSplit.push(splitStr[i]);
                }
                return newSplit;
            }
        };
        const code = args.join(' ');
        async function success(input, output) {
            msg.channel.createMessage({
                embed: {
                    color: 0x36393E,
                    fields: [{
                        name: 'Input',
                        value: `\`\`\`JS\n${input}\`\`\``,
                    }, {
                        name: 'Output',
                        value: `\`\`\`JS\n${output} | ... |\`\`\``,
                    }],
                },
            });
        }
        async function error(input, output) {
            msg.channel.createMessage({
                embed: {
                    color: 0x36393E,
                    fields: [{
                        name: 'Input',
                        value: `\`\`\`JS\n${input}\`\`\``,
                    }, {
                        name: 'Error Output',
                        value: `\`\`\`JS\n${output}\`\`\``,
                    }],
                },
            });
        }
        function clean(text) {
            if (typeof (text) === 'string') {
                text = text.replace(/`/g, `\`${String.fromCharCode(8203)}`).replace(/@/g, `@${String.fromCharCode(8203)}`);
                const tokenObj = new RegExp(`${Buffer.from(_this.bot.user.id).toString('base64')}\\S+(?="|'|\`)`, 'gm');
                const tokenRaw = new RegExp(`${Buffer.from(_this.bot.user.id).toString('base64')}\\S+`, 'gm');
                if (text.match(tokenObj)) {
                    text = text.replace(tokenObj, 'Token Cleaned');
                    return text;
                } if (text.match(tokenRaw)) {
                    text = text.replace(tokenRaw, 'Token Cleaned');
                    return text;
                }
                return text;
            }
            return text;
        }
        try {
            let evaled = eval(code);
            if (typeof evaled !== 'string') {
                evaled = require('util').inspect(evaled, {
                    breakLength: Infinity,
                });
            }
            if (evaled.length > 1000) {
                const output = clean(evaled).charLimitSplit(1000);
                return success(code, output[0]);
            }
            return success(code, clean(evaled));
        } catch (err) {
            if (err.length > 1000) {
                const errorSplit = err.charLimitSplit(1000);
                return error(code, errorSplit);
            }
            return error(code, clean(err));
        }
    },
};
