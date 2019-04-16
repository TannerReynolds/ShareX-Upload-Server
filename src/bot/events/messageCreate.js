async function messageCreate(msg) {
    if (!this.c.discordAdminIDs.includes(msg.author.id)) return;
    if (msg.content.indexOf(this.c.prefix) !== 0) return;
    const args = msg.content.slice(this.c.prefix.length).trim().split(/ +/g);
    const command = args.shift().toString().toLowerCase();
    for (let i = 0; this.commands.length > i; i++) {
        if (this.commands[i].command === command) {
            this.commands[i].execute(this, msg, args);
        }
    }
}
module.exports = messageCreate;
