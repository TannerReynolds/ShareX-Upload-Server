const express = require("express")
const fs = require("fs")
const app = express()
const bodyParser = require("body-parser")
const path = require("path")
const formidable = require("formidable")
const c = require("./config.json")
const Eris = require("eris")
const bot = new Eris(c.discordToken, { maxShards: "auto" })
const Remarkable = require("remarkable")
const ejs = require("ejs")
const md = new Remarkable("full", {
  html: true,
  linkify: true,
  typographer: true
})

// APP SETTINGS
app.set("view engine", "ejs");
app.use(bodyParser.text())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("./uploads/", {
  extensions: c.admin.allowed
}))
app.use(express.static("./pages/", {
  extensions: [ "html", "css" ],
}))

// DISCORD BOT SETUP
let monitorChannel = null
if(c.discordToken && c.discordToken !== undefined && c.discrdToken !== null) {
  console.log("Connecting to Discord...")
  let commands = [];
  fs.readdir("./commands/", (err, files) => {
    files.forEach(file => {
      if(file.toString().indexOf("_") != 0 && file.toString().includes(".js")){
        commands.push(require(`./commands/${file.toString()}`))
        console.log(`Loaded Command: ${file.toString()}`)
      }
    })
  })
  let prefix = c.prefix
  bot.on("ready", () => {
    console.log("Discord API monitor successfully logged in")
    monitorChannel = c.discordChannelID
  })
  bot.on("messageCreate", async msg => {
    if(!c.discordAdminIDs.includes(msg.author.id)) return
    if(msg.content.indexOf(prefix) !== 0) return
    const args = msg.content.slice(prefix.length).trim().split(/ +/g)
    const command = args.shift().toString().toLowerCase()
    for(i=0;commands.length>i;i++) {
      if(commands[i].command == command) {
        await commands[i].execute(bot, msg, args, commands, prefix)
        break
      }
    }
  })
} else {
  console.log("No Discord Token provided...\nContinuing without Discord connection...")
}

// INDEX
app.get("/", (req, res) => {
  if(fs.existsSync("./pages/index.html")) {
    res.setHeader("Content-Type", "text/html")
    res.write(fs.readFileSync("./pages/index.html"))
    res.end()
  } else {
    res.setHeader("Content-Type", "text/html")
    res.write(fs.readFileSync("./pages/404.html"))
    res.end()
  }
})

app.get("/gallery", (req, res) => {
  if(fs.existsSync("./pages/gallery.html")) {
    res.setHeader("Content-Type", "text/html")
    res.write(fs.readFileSync("./pages/gallery.html"))
    res.end()
  } else {
    res.setHeader("Content-Type", "text/html")
    res.write(fs.readFileSync("./pages/404.html"))
    res.end()
  }
})

app.get("/short", (req, res) => {
  if(fs.existsSync("./pages/short.html")) {
    res.setHeader("Content-Type", "text/html")
    res.write(fs.readFileSync("./pages/short.html"))
    res.end()
  } else {
    res.setHeader("Content-Type", "text/html")
    res.write(fs.readFileSync("./pages/404.html"))
    res.end()
  }
})

// ERROR HANDLE EXPLANATION
app.get("/ERR_FILE_TOO_BIG", (req, res) => {
  res.setHeader("Content-Type", "text/html")
  res.write(fs.readFileSync("./pages/ERR_FILE_TOO_BIG.html"))
  res.end()
})
app.get("/ERR_ILLEGAL_FILE_TYPE", (req, res) => {
  res.setHeader("Content-Type", "text/html")
  res.write(fs.readFileSync("./pages/ERR_ILLEGAL_FILE_TYPE.html"))
  res.end()
})

// Version
app.get("/QWS/version", (req, res) => {
  res.setHeader("Content-Type", "text/html")
  res.write("3.0.0")
  res.end()
})

// 404
app.get("*", (req, res) => {
  res.setHeader("Content-Type", "text/html")
  res.write(fs.readFileSync("./pages/404.html"))
  res.end()
})

// URL SHORTENER
app.post("/api/shortener", (req, res) => {
  let form = new formidable.IncomingForm()
  form.parse(req, (err, fields, files) => {
    let userIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress
    if(!auth(req, res, c.key, fields.key, userIP)) {
      res.write("Unauthorized"); 
      res.end(); 
      return console.log(`Unauthorized User | File Upload | ${userIP}`)
    }
    let fileName = randomToken(4) // 14,776,336 possible file names
    let url = req.headers.url
    if(url == undefined || url == "" || url == null) {
      res.send("NO_URL_PROVIDED") 
      return res.end()
    }
    if(!/([-a-zA-Z0-9^\p{L}\p{C}\u00a1-\uffff@:%_\+.~#?&//=]{2,256}){1}(\.[a-z]{2,4}){1}(\:[0-9]*)?(\/[-a-zA-Z0-9\u00a1-\uffff\(\)@:%,_\+.~#?&//=]*)?([-a-zA-Z0-9\(\)@:%,_\+.~#?&//=]*)?/.test(url.toLowerCase().toString())) {
      res.send("NOT_A_VALID_URL") 
      return res.end()
    } else {
      let stream = fs.createWriteStream(`./uploads/${fileName}.html`)
      stream.once("open", fd => {
        stream.write(`<meta http-equiv="refresh" content="0; url=${url}" />`)
        stream.end()
        if(monitorChannel !== null) bot.createMessage(monitorChannel, `\`\`\`MARKDOWN\n[NEW][SHORT URL]\n[URL](${url})\n[NEW](${req.headers.host}/${fileName})\n[IP](${userIP})\n\`\`\``)
        res.write(`http://${req.headers.host}/${fileName}`)
        return res.end()
      })
    }
  })
})

// FOR FRONT END SHORTENER PAGE
app.post("/short", (req, res) => {
  res.setHeader("Content-Type", "text/text");
  let fileName = randomToken(4)
  if(req.body.URL == undefined || req.body.URL == "" || req.body.URL == null) {
    res.redirect("/short?error=No URL Input");
    return res.end();
  } 
  let stream = fs.createWriteStream(`./uploads/${fileName}.html`)
    stream.once("open", fd => {
      console.log(req.body.URL)
      stream.write(`<meta http-equiv="refresh" content="0;URL='${req.body.URL}'" />`);
      stream.end();
      if(monitorChannel !== null) bot.createMessage(monitorChannel, `\`\`\`MARKDOWN\n[NEW][SHORT URL]\n[URL](${url})\n[NEW](${req.headers.host}/${fileName})\n[IP](${userIP})\n\`\`\``)
      res.redirect(`/short?success=http://${req.headers.host}/${fileName}`);
      return res.end();
    });
});

// GALLERY
app.post("/gallery", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  let password = c.admin.key
  if(req.body.password !== password) {
    res.write(fs.readFileSync("./pages/unauthorized.html"))
    return res.end()
  }
  let pics = [];
  fs.readdir("./uploads/", (err, files) => {
    files.forEach((file, idx, array) => {
      if(file.toString().includes(".jpg") || file.toString().includes(".png") || file.toString().includes(".gif")) {
        pics.push(`http://${req.headers.host}/${file.toString()}`);
        if (idx === array.length - 1){ 
          res.render("gallery", {pictures: pics})
          return res.end(); 
        }
      }
    });
  });
});

// PASTE ENDPOINT
app.post("/api/paste", (req, res) => {
  res.setHeader("Content-Type", "text/text")
  let fileName = randomToken(5) // 916,132,832 possible file names
  let form = new formidable.IncomingForm()
  form.parse(req, (err, fields, files) => {
    let userIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress
    if(!auth(req, res, c.key, fields.key, userIP)) {
      res.write("Unauthorized"); 
      res.end(); 
      return console.log(`Unauthorized User | File Upload | ${userIP}`)
    }
    let oldpath = files.fdata.path
    let newpath = `./uploads/${fileName+files.fdata.name.toString().match(/(\.)+([a-zA-Z0-9]+)+/g, "").toString()}`;
    if(!c.paste.allowed.includes(files.fdata.name.substring(files.fdata.name.lastIndexOf(".")+1, files.fdata.name.length))) {
      res.write(`http://${req.headers.host}/ERR_ILLEGAL_FILE_TYPE`) 
      return res.end()
    } else {
      if(Math.round((files.fdata.size/1024)/1000) > c.paste.max_upload_size) {
        if(monitorChannel !== null) bot.createMessage(monitorChannel, `\`\`\`MARKDOWN\n[FAILED PASTE][USER]\n[FILE](${files.fdata.name})\n[SIZE](${Math.round(files.fdata.size/1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${user_ip})\n\n[ERROR](ERR_FILE_TOO_BIG)\`\`\``)
        res.write(`http://${req.headers.host}/ERR_FILE_TOO_BIG`) 
        return res.end()
      } else {
        fs.rename(oldpath, newpath, err => {
          fs.readFile(newpath, "utf-8", function read(err, data) {
            let stream = fs.createWriteStream(`./uploads/${fileName}.html`)
            stream.once("open", fd => {
              let cleaned = data.replace(/>/g, "&gt")
              cleaned = cleaned.replace(/</g, "&lt")
              ejs.renderFile("./views/paste.ejs", {ogDesc: data.match(/.{1,297}/g)[0], pData: data}, {}, (err, str) => {
                stream.write(str)
              })
              stream.end()
              fs.unlink(newpath, err => {
                if(err) return console.log(err)
              });
              res.write(`http://${req.headers.host}/${fileName}`)
              if(monitorChannel !== null) bot.createMessage(monitorChannel, `\`\`\`MARKDOWN\n[NEW PASTE]\n[IP](${userIP})\n\`\`\`\nhttp://${req.headers.host}/${fileName}`)
              return res.end()
            })
          })
        })
      }
    }
  })
})

// FILE UPLOADER
app.post("/api/files", (req, res) => {
  res.setHeader("Content-Type", "text/text")
  let fileName = randomToken(6) // 56,800,235,584 possible file names
  let form = new formidable.IncomingForm()
  form.parse(req, (err, fields, files) => {
    let userIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress
    if(!auth(req, res, c.key, fields.key, userIP)) {
      res.write("Unauthorized"); 
      res.end(); 
      return console.log(`Unauthorized User | File Upload | ${userIP}`)
    }
    let oldpath = files.fdata.path
    let newpath = `./uploads/${fileName+files.fdata.name.toString().match(/(\.)+([a-zA-Z0-9]+)+/g, "").toString()}`
    if(fields.key === c.admin.key) {
      if(Math.round((files.fdata.size/1024)/1000) > c.admin.maxUploadSize) {
        if(monitorChannel !== null) bot.createMessage(monitorChannel, `\`\`\`MARKDOWN\n[FAILED UPLOAD][ADMIN]\n[FILE](${files.fdata.name})\n[SIZE](${Math.round(files.fdata.size/1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n\n[ERROR](ERR_FILE_TOO_BIG)\`\`\``)
          res.write(`http://${req.headers.host}/ERR_FILE_TOO_BIG`) 
          return res.end()
      } else {
        fs.rename(oldpath, newpath, err => {
          if(files.fdata.name.substring(files.fdata.name.lastIndexOf(".")+1, files.fdata.name.length).toLowerCase() === "md" && c.markdown) { 
            fs.readFile(newpath, "utf-8", function read(err, data) {
              let stream = fs.createWriteStream(`./uploads/${fileName}.html`)
              stream.once("open", fd => {
                ejs.renderFile("./views/md.ejs", {ogDesc: data.match(/.{1,297}/g)[0], mdRender: md.render(data)}, {}, (err, str) => {
                  stream.write(str)
                })
                stream.end()
                fs.unlink(newpath, err => {
                  if(err) return console.log(err)
                });
              })
            })
          }
          if(monitorChannel !== null) bot.createMessage(monitorChannel, `\`\`\`MARKDOWN\n[NEW UPLOAD][ADMIN]\n[SIZE](${Math.round(files.fdata.size/1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\`\`\`\nhttp://${req.headers.host}/${fileName}`)
          if(err) return res.write(err)
          res.write(`http://${req.headers.host}/${fileName}`)
          return res.end()
        })
      }
    } else {
      if(Math.round((files.fdata.size/1024)/1000) > c.maxUploadSize) {
        if(monitorChannel !== null) bot.createMessage(monitorChannel, `\`\`\`MARKDOWN\n[FAILED UPLOAD][USER]\n[FILE](${files.fdata.name})\n[SIZE](${Math.round(files.fdata.size/1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n\n[ERROR](ERR_FILE_TOO_BIG)\`\`\``)
          res.write(`http://${req.headers.host}/ERR_FILE_TOO_BIG`) 
          return res.end()
      } else {
        //if(!c.allowed.includes(files.fdata.type.toString().toLowerCase().replace(/[A-Za-z]+(\/)+/g,""))) {
        if(!c.allowed.includes(files.fdata.name.substring(files.fdata.name.lastIndexOf(".")+1, files.fdata.name.length))) {
          if(monitorChannel !== null) bot.createMessage(monitorChannel, `\`\`\`MARKDOWN\n[FAILED UPLOAD][USER]\n[FILE](${files.fdata.name})\n[SIZE](${Math.round(files.fdata.size / 1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n\n[ERROR](ERR_ILLEGAL_FILE_TYPE)\`\`\``)
            res.write(`http://${req.headers.host}/ERR_ILLEGAL_FILE_TYPE`) 
            return res.end()
        } else {
          fs.rename(oldpath, newpath, err => {
            if(files.fdata.name.substring(files.fdata.name.lastIndexOf(".")+1, files.fdata.name.length).toLowerCase() === "md" && c.markdown) {
              fs.readFile(newpath, "utf-8", function read(err, data) {
                let stream = fs.createWriteStream(`./uploads/${fileName}.html`)
                stream.once("open", fd => {
                  ejs.renderFile("./views/md.ejs", {ogDesc: data.match(/.{1,297}/g)[0], mdRender: md.render(data)}, {}, (err, str) => {
                    stream.write(str)
                  })
                  stream.end()
                  fs.unlink(newpath, err => {
                    if(err) return console.log(err)
                  });
                })
              })
            }
            if(monitorChannel !== null) bot.createMessage(monitorChannel, `\`\`\`MARKDOWN\n[NEW UPLOAD][USER]\n[SIZE](${Math.round(files.fdata.size/1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n\`\`\`\nhttp://${req.headers.host}/${fileName}`)
            if(err) return res.write(err)
            res.write(`http://${req.headers.host}/${fileName}`)
            return res.end()
          })
        }
      }
    }
  })
})

app.listen(80, () => {
  console.log("Server listening on port 80")
  if(c.discordToken && c.discordToken !== undefined && c.discrdToken !== null) {
    bot.connect()
  }
})
app.listen(443, () => {
  console.log("Server listening on port 443")
})
function randomToken(number) {
  number = parseInt(number)
  let text = ""
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  for (i = 0; i < number; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}
function auth(req, res, myKey, givenKey, ip) {
  if(myKey !== null && myKey && myKey !== undefined && givenKey !== myKey) {
    return false
  } else {
    return true
  }
}

process.on("unhandledRejection", reason => console.log(reason));
process.on("uncaughtException", err => console.log(err));
