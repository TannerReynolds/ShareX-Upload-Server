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

/** Express Webserver Class */
class ShareXAPI {
  /**
   * Starting server and bot, handling routing, and middleware
   * @param {object} c - configuration json file
   */
  constructor (c) {
    this.db = db
    /** Setting LowDB Defaults */
    db.defaults({ files: [], bans: [], visitors: [], trafficTotal: [], passwordUploads: [], })
      .write();
    /** Defintions */
    this.utils = utils
    this.log = utils.log
    this.auth = utils.auth
    this.randomToken = utils.randomToken
    this.mimeType = utils.mimeType
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
    /** Checking to see if IP is banned */
    this.app.use((req, res, next) => {
        let userIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress
        let exists = this.db.get("bans").find({ip: userIP}).value();
        if(exists === undefined) { // if a ban was not found, then it will move on
            next()
        } else {
            res.statusCode = 401
            res.render("unauthorized")
            return res.end();
        }
    })
    /** Set to place IPs in temporarily for ratelimiting uploads */
    let ratelimited = new Set()
    this.app.use((req, res, next) => {
        if(req.method === "POST") {
            let userIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress
            if(ratelimited.has(userIP)) {
                res.statusCode = 429
                res.write("Error 429: Ratelimited")
                return res.end()
            } else {
                next() // Move on if IP is not in ratelimited set
                ratelimited.add(userIP)
                setTimeout(() => ratelimited.delete(userIP), c.ratelimit) // delete IP from ratelimit set after time specified in config.json
            }
        } else {
            next() // move on if request type is not POST
        }
    })
    this.app.use((req, res, next) => {
        if(req.method === "GET") {
            let userIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress
            let file = req.path
            // Not ignoring these files causes bloat in the db
            let ignored = ["/favicon.ico", "/assets/css/styles.min.css", "/highlight.pack.js", "/highlightjs-line-numbers.min.js", "/paste.css", "/atom-one-dark.css"]
            let exists = this.db.get("files").find({path: file}).value();
            if(ignored.includes(file)) exists = true // making sure ignored files aren't included
            if(exists === undefined) {
                next() // Move on if it doesn't exist, then input data into db
                this.db.get("files")
                    .push({path: file, ip: "Unknown", views: 0})
                    .write(); // Set IP to unknown in case a file is visited, and not uploaded using /api/files
                if(!ignored.includes(file)) {
                    this.db.get("visitors")
                        .push({date: new Date(), ip: userIP, path: file})
                        .write(); // Sets correct information for files uploaded with /api/files
                }
            } else {
                next() // Move on if the file already exists
                let trafficPeriod = this.trafficPeriod() // Gets month and year for tracking
                let viewCount
                let trafficCount
                let filesExist = this.db.get("files").find({path: file}).value() // traffic exists for this file
                let trafficExists = this.db.get("trafficTotal").find({month: trafficPeriod}).value() // traffic exists for this month and year
                let visitors = this.db.get("visitors").value()
                // Resetting visitors in the DB every 100 requests so the DB doesn't get bloated
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
                    .write(); // Setting viewcount for file
                if(!ignored.includes(file)) {
                    this.db.get("visitors")
                        .push({date: new Date(), ip: userIP, path: file})
                        .write(); // Adding vsitor information to DB
                }
                if(!ignored.includes(file)) {
                    this.db.get("trafficTotal")
                        .find({month: trafficPeriod})
                        .assign({total: trafficCount})
                        .write(); // if request isn't to an ignored file, take request into total traffic
                }
            }
        } else {
            next()
        }
    })
    // All files in /uploads/ are publicly accessible via http
    this.app.use(express.static(`${__dirname}/uploads/`, {
        extensions: this.c.admin.allowed
    }))
    this.app.use(express.static(`${__dirname}/views/`, {
        extensions: ["css"],
    }))

    // routing
    this.app.get("/", routes.upload.bind(this))
    this.app.get("/gallery", routes.gallery.get.bind(this))
    this.app.get("/short", routes.short.get.bind(this))
    this.app.get("/upload", routes.upload.bind(this))
    this.app.get("/ERR_FILE_TOO_BIG", routes.fileTooBig.bind(this))
    this.app.get("/ERR_ILLEGAL_FILE_TYPE", routes.illegalFileType.bind(this))
    this.app.get("*", routes.err404.bind(this))
    this.app.post("/api/shortener", routes.shortener.bind(this))
    this.app.post("/short", routes.short.post.bind(this))
    this.app.post("/gallery", routes.gallery.post.bind(this))
    this.app.post("/pupload", routes.pupload.bind(this))
    this.app.post("/api/paste", routes.paste.bind(this))
    this.app.post("/api/files", routes.files.bind(this))

    // Begin server
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
        if(fs.existsSync(`${__dirname}/../key.pem`) && fs.existsSync(`${__dirname}/../cert.pem`)) {
            let privateKey = fs.readFileSync(`${__dirname}/../key.pem`);
            let certificate = fs.readFileSync(`${__dirname}/../cert.pem`);
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

  protocol() {
    if(this.c.secure) {
        return "https"
    } else {
        return "http"
    }
  }
}

module.exports = ShareXAPI;
