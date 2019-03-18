const express = require("express")
const fs = require("fs-extra")
const app = express()
const bodyParser = require("body-parser")
const Eris = require("eris")
const ejs = require("ejs")
const path = require("path")
const utils = require(`${__dirname}/../util`)
const routes = require(`${__dirname}/routes`)
const https = require("https")
const events = require(`${__dirname}/../bot/events`)
const low = require("lowdb")
const FileSync = require("lowdb/adapters/FileSync")
const adapter = new FileSync("db.json")
const db = low(adapter)
const helmet = require("helmet")

class ShareXAPI {
  constructor (c) {
    this.db = db
    db.defaults({ files: [], bans: [], visitors: [], trafficTotal: [] })
      .write();
    this.utils = utils
    this.log = utils.log
    this.auth = utils.auth
    this.randomToken = utils.randomToken
    this.c = c;
    this.monitorChannel = null
    this.checkMonth()
    this.c.discordToken && this.c.discordToken !== undefined && this.c.discrdToken !== null 
        ? this.runDiscordBot()
        : this.log.verbose("No Discord Token provided...\nContinuing without Discord connection...")
    this.app = app
    this.app.set("view engine", "ejs");
    this.app.set('views', path.join(__dirname, '/views'));
    this.app.use(helmet())
    this.app.use(bodyParser.text())
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({
        extended: true
    }));
    this.app.use((req, res, next) => {
        let userIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress
        let exists = this.db.get("bans").find({ip: userIP}).value();
        if(exists === undefined) {
            next()
        } else {
            res.statusCode = 401
            res.render("unauthorized")
            return res.end();
        }
    })
    let ratelimited = new Set()
    this.app.use((req, res, next) => {
        if(req.method === "POST") {
            let userIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress
            if(ratelimited.has(userIP)) {
                res.statusCode = 429
                res.write("Error 429: Ratelimited")
                return res.end()
            } else {
                next()
                ratelimited.add(userIP)
                setTimeout(() => ratelimited.delete(userIP), c.ratelimit)
            }
        } else {
            next()
        }
    })
    this.app.use((req, res, next) => {
        if(req.method === "GET") {
            let userIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress
            let file = req.path
            let ignored = ["/favicon.ico", "/assets/css/styles.min.css", "/highlight.pack.js", "/highlightjs-line-numbers.min.js", "/paste.css", "/atom-one-dark.css"]
            let exists = this.db.get("files").find({path: file}).value();
            if(ignored.includes(file)) exists = true
            if(exists === undefined) {
                next()
                this.db.get("files")
                    .push({path: file, ip: "Unknown", views: 0})
                    .write();
                if(!ignored.includes(file)) {
                    this.db.get("visitors")
                        .push({date: new Date(), ip: userIP, path: file})
                        .write();
                }
            } else {
                next()
                let trafficPeriod = this.trafficPeriod()
                let viewCount
                let trafficCount
                let filesExist = this.db.get("files").find({path: file}).value()
                let trafficExists = this.db.get("trafficTotal").find({month: trafficPeriod}).value()
                let visitors = this.db.get("visitors").value()
                if(visitors.length > 100) {
                    this.db.set("visitors", [])
                    .write();
                }
                filesExist === undefined
                    ? viewCount = 0
                    : viewCount = filesExist.views + 1;
                trafficExists === undefined
                    ? trafficCount = 0
                    : trafficCount = trafficExists.total + 1
                this.db.get("files")
                    .find({path: file})
                    .assign({views: viewCount})
                    .write();
                if(!ignored.includes(file)) {
                    this.db.get("visitors")
                        .push({date: new Date(), ip: userIP, path: file})
                        .write();
                }
                if(!ignored.includes(file)) {
                    this.db.get("trafficTotal")
                        .find({month: trafficPeriod})
                        .assign({total: trafficCount})
                        .write();
                }
            }
        } else {
            next()
        }
    })
    this.app.use(express.static(`${__dirname}/uploads/`, {
        extensions: this.c.admin.allowed
    }))
    this.app.use(express.static(`${__dirname}/views/`, {
        extensions: ["css"],
    }))
    this.app.get("/", routes.main.bind(this))
    this.app.get("/gallery", routes.gallery.get.bind(this))
    this.app.get("/short", routes.short.get.bind(this))
    this.app.get("/upload", routes.upload.bind(this))
    this.app.get("/ERR_FILE_TOO_BIG", routes.fileTooBig.bind(this))
    this.app.get("/ERR_ILLEGAL_FILE_TYPE", routes.illegalFileType.bind(this))
    this.app.get("*", routes.err404.bind(this))
    this.app.post("/api/shortener", routes.shortener.bind(this))
    this.app.post("/short", routes.short.post.bind(this))
    this.app.post("/gallery", routes.gallery.post.bind(this))
    this.app.post("/api/paste", routes.paste.bind(this))
    this.app.post("/api/files", routes.files.bind(this))
    this.startServer()
}

  async runDiscordBot() {
    this.bot = new Eris(this.c.discordToken, {
        maxShards: "auto"
    })
    this.log.verbose("Connecting to Discord...")
    this.commands = [];
    this.loadCommands();
    this.bot
       .on("messageCreate", events.messageCreate.bind(this))
       .on("ready", events.ready.bind(this));
    this.bot.connect()
  }

  async loadCommands() {
    fs.readdir(`${__dirname}/../bot/commands`, (err, files) => {
        files.forEach(file => {
            if (file.toString().includes(".js")) {
                this.commands.push(require(`${__dirname}/../bot/commands/${file.toString()}`))
                this.log.verbose(`Loaded Command: ${file.toString()}`)
            }
        })
    })
  }

  async startServer() {
    if(this.c.secure) {
        if(fs.existsSync(`${__dirname}/../src/key.pem`) && fs.existsSync(`${__dirname}/../src/cert.pem`)) {
            let privateKey = fs.readFileSync(`${__dirname}/../src/key.pem`);
            let certificate = fs.readFileSync(`${__dirname}/../src/cert.pem`);
            https.createServer({
                key: privateKey,
                cert: certificate
            }, this.app).listen(this.c.securePort, "0.0.0.0");
        } else {
            // CF Flexible SSL
            this.app.listen(this.c.securePort, "0.0.0.0", () => {
                this.log.warning(`Server using flexible SSL secure setting\nTo run a full SSL setting, ensure key.pem and cert.pem are in the /src folder`)
            })
        }
        this.log.success(`Secure server listening on port ${this.c.securePort}`)
    } else {
        this.app.listen(this.c.port, "0.0.0.0", () => {
            this.log.success(`Server listening on port ${this.c.port}`)
        })
    }
  }

  async checkMonth() {
      let trafficPeriod = this.trafficPeriod()
      let dbMonth = this.db.get("trafficTotal").find({month: trafficPeriod}).value()
      if(dbMonth === undefined) {
          this.db.get("trafficTotal")
            .push({ month: trafficPeriod, total: 0 })
            .write();
      }
  }

  trafficPeriod() {
    let date = new Date()
    let currentMonth = date.getMonth() + 1
    let currentYear = date.getFullYear()
    return `${currentMonth}/${currentYear}`
  }
}

module.exports = ShareXAPI;
