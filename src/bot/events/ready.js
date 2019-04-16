async function ready() {
    this.log.success('Discord API monitor successfully logged in');
    this.monitorChannel = this.c.discordChannelID;
}
module.exports = ready;
