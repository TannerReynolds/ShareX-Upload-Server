module.exports = {
    command: 'rv',
    description: 'Displays recent visitors',
    syntax: '{PREFIX}rv',
    execute: async (_this, msg) => {
        const visitors = _this.db.get('visitors').value();
        if (visitors === undefined) {
            msg.channel.createMessage('Your site has no visitors');
        } else {
            const recent = visitors.map(e => e.date).sort().reverse();
            const visitorsCollection = [];
            let maximum;
            recent.length > 10
                ? maximum = 10
                : maximum = recent.length;
            for (let i = 0; i < maximum; i++) {
                const targetData = _this.db.get('visitors').find({ date: recent[i] }).value();
                visitorsCollection.push(`[IP]: ${targetData.ip}\n[Page]: ${targetData.path}`);
                if (i + 1 >= maximum) {
                    msg.channel.createMessage(`**ShareX Server Recent Visitors**\n\`\`\`ini\n${visitorsCollection.join('\n\n')}\n\`\`\``);
                }
            }
        }
    },
};
