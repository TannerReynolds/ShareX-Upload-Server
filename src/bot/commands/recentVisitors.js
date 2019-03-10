module.exports = {
    command:"rv",
    description: "Displays recent visitors",
    syntax: "{PREFIX}rv",
    execute:async (_this, msg, args) => {
      let visitors = _this.db.get("visitors").value();
      if(visitors === undefined) {
          msg.channel.createMessage("Your site has no visitors")
      } else {
          let visitors = _this.db.get("visitors").value();
          let recent = visitors.map(e => { return e.date }).sort().reverse()
          let visitorsCollection = []
          let maximum
          recent.length > 10
            ? maximum = 10
            : maximum = recent.length
          for(i = 0; i < maximum; i++) {
              let targetData = _this.db.get("visitors").find({date: recent[i]}).value();
              visitorsCollection.push(`[IP]: ${targetData.ip}\n[Page]: ${targetData.path}`)
              if(i + 1 >= maximum) {
                  msg.channel.createMessage(`**ShareX Server Recent Visitors**\n\`\`\`ini\n${visitorsCollection.join("\n\n")}\n\`\`\``)
              }
          }
      }
    }
  }