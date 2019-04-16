module.exports = {
    command: 'trafficfor',
    description: 'Find amount of traffic for a specific month',
    syntax: '{PREFIX}trafficfor [Month] [Year(optional)]',
    execute: async (_this, msg, args) => {
        if (!args.join(' ')) return msg.channel.createMessage('No arguments were given');
        const month = args[0].toLowerCase();
        let year;
        args[1]
            ? year = `/${args[1]}`
            : year = `/${new Date().getFullYear()}`;
        const months = ['january', 'febuary', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        if (!months.includes(month)) return msg.channel.createMessage('This is not a month.');
        const selectedMonth = `${months.indexOf(month) + 1}${year}`;
        const traffic = _this.db.get('trafficTotal').find({ month: selectedMonth }).value();
        if (traffic === undefined) {
            msg.channel.createMessage('There has not been any traffic for this month');
        } else {
            msg.channel.createMessage(`There have been a total of \`${traffic.total}\` views of your site this month..`);
        }
    },
};
