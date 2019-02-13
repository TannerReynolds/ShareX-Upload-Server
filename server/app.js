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

class ShareXAPI {
  constructor (c) {
    this.utils = utils
    this.log = utils.log
    this.auth = utils.auth
    this.randomToken = utils.randomToken
    this.c = c;
    this.monitorChannel = null
    this.c.discordToken && this.c.discordToken !== undefined && this.c.discrdToken !== null ? this.runDiscordBot()
        : this.log.verbose("No Discord Token provided...\nContinuing without Discord connection...")
    this.app = app
    this.app.set("view engine", "ejs");
    this.app.set('views', path.join(__dirname, '/views'));
    this.app.use(bodyParser.text())
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({
        extended: true
    }));
    this.app.use(express.static(`${__dirname}/uploads/`, {
        extensions: this.c.admin.allowed
    }))
    this.app.use(express.static(`${__dirname}/views/`, {
        extensions: ["css"],
    }))
    this.app.get("/", routes.main.bind(this))
    this.app.get("/gallery", routes.gallery.get.bind(this))
    this.app.get("/short", routes.short.get.bind(this))
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
    fs.readdir(`${__dirname}./../bot/commands`, (err, files) => {
        files.forEach(file => {
            if (file.toString().includes(".js")) {
                this.commands.push(require(`${__dirname}./../bot/commands/${file.toString()}`))
                this.log.verbose(`Loaded Command: ${file.toString()}`)
            }
        })
    })
  }

  async startServer() {
    if(this.c.secure) {
        let privateKey = fs.readFileSync("key.pem");
        let certificate = fs.readFileSync("cert.pem");
        https.createServer({
            key: privateKey,
            cert: certificate
        }, this.app).listen(this.c.securePort);
        this.log.success(`Secure server listening on port ${this.c.securePort}`)
    } else {
        this.app.listen(this.c.port, () => {
            this.log.success(`Server listening on port ${this.c.port}`)
        })
    }
  }
}

module.exports = ShareXAPI;