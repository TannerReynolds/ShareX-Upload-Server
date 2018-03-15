const express = require('express');
const fs = require('fs');
const app = express();
const bodyParser = require('body-parser');
const path = require("path");
const formidable = require('formidable');
const Discord = require('discord.js');
const client = new Discord.Client();
const $con = require('./config.json');

// APP SETTINGS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname+"/uploads/", {
  extensions: [ "png", "jpg", "gif", "mp4", "mp3", "txt", "jpeg", "tiff", "bmp", "ico", "psd", "eps", "raw", "cr2", "nef", "sr2", "orf", "svg", "wav", "webm", "aac", "flac", "ogg", "wma", "m4a", "gifv", "html" ],
}));
app.use(express.static(__dirname+"/pages/", {
  extensions: [ "html", "css" ],
}));

// DISCORD BOT SET MONITOR CHANNEL
let monitorChannel = null;
if($con.discordToken && $con.discordToken !== undefined && $con.discrdToken !== null) {
  client.on('ready', ()=> {
    console.log('Discord API monitor successfully logged in');
    monitorChannel = client.guilds.get($con.discordServerID).channels.get($con.discordChannelID);
  });
}

// ERROR HANDLE EXPLANATION
app.get('/ERR_FILE_TOO_BIG', (req, res)=>{
  res.setHeader('Content-Type', 'text/html');
  res.write(fs.readFileSync(__dirname+"/pages/ERR_FILE_TOO_BIG.html"));
  res.end();
});
app.get('/ERR_ILLEGAL_FILE_TYPE', (req, res)=>{
  res.setHeader('Content-Type', 'text/html');
  res.write(fs.readFileSync(__dirname+"/pages/ERR_ILLEGAL_FILE_TYPE.html"));
  res.end();
});

// 404
app.get('*', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.write(fs.readFileSync(__dirname+"/pages/404.html"));
  res.end();
});

// POST REQUESTS
////////////////////////////////////////////
// URL SHORTENER
app.post('/api/shortener', (req, res)=>{
  var userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
  var fileName = randomToken(6);
  res.setHeader('Content-Type', 'text/text');
  if(req.body.url == undefined || req.body.url == "" || req.body.url == null){
    res.send('NO_URL_PROVIDED'); return res.end();
  }
  if(!/([-a-zA-Z0-9^\p{L}\p{C}\u00a1-\uffff@:%_\+.~#?&//=]{2,256}){1}(\.[a-z]{2,4}){1}(\:[0-9]*)?(\/[-a-zA-Z0-9\u00a1-\uffff\(\)@:%,_\+.~#?&//=]*)?([-a-zA-Z0-9\(\)@:%,_\+.~#?&//=]*)?/.test(req.body.url.toLowerCase().toString())){
    res.send('NOT_A_VALID_URL'); return res.end();
  } else{
    var stream = fs.createWriteStream(__dirname+"/uploads/s/"+fileName+".html");
    stream.once('open', fd => {
      stream.write(`<meta http-equiv="refresh" content="0;URL='${req.body.url}'" />`);
      stream.end();
      if(monitorChannel !== null) monitorChannel.send("```MARKDOWN\n[NEW][SHORT URL]\n[URL]("+req.body.url+")\n[NEW]("+req.headers.host+"/"+fileName+")\n[IP]("+userIP+")\n```");
      console.log("[NEW][SHORT URL]\n[URL]("+req.body.url+")\n[NEW]("+req.headers.host+"/"+fileName+")\n[IP]("+userIP+")")
      res.send({ url: `http://${req.headers.host}/${fileName}`, file: fileName});
      return res.end();
    });
  }
});


app.post('/api/paste', (req, res) => {
  res.setHeader('Content-Type', 'text/text');
  var fileName = randomToken(6);
  var form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    var oldpath = files.fdata.path;
    var newpath = "./code/"+fileName+files.fdata.name.toString().match(/(\.)+([a-zA-Z]+)+/g, '').toString();
    if(!$con.paste.allowed.includes(files.fdata.name.substring(files.fdata.name.lastIndexOf('.')+1, files.fdata.name.length))){
      res.write("http://"+req.headers.host+"/"+"ERR_ILLEGAL_FILE_TYPE"); return res.end();
    } else {
    if(Math.round((files.fdata.size/1024)/1000) > $con.paste.max_upload_size){
      if(monitorChannel !== null) monitorChannel.send("```MARKDOWN\n[FAILED PASTE][USER]\n[FILE]("+files.fdata.name+")\n[SIZE]("+Math.round(files.fdata.size/1024)+"KB)\n[TYPE]("+files.fdata.type+")\n[IP]("+user_ip+")\n\n[ERROR](ERR_FILE_TOO_BIG)```");
      res.write("http://"+req.headers.host+"/"+"ERR_FILE_TOO_BIG"); return res.end();
    } else{
      fs.rename(oldpath, newpath, err => {
        fs.readFile(newpath, 'utf-8', function read(err, data) {
          var stream = fs.createWriteStream(__dirname+"/p/"+fileName+".html");
          stream.once('open', fd => {
            let cleaned = data.replace(/>/g, "&gt;");
            cleaned = cleaned.replace(/</g, "&lt;");
            stream.write(`
            <!DOCTYPE html>
            <html>
            <head>
            <meta name="theme-color" content="#DC603A">
            <link rel="stylesheet" href="atom-one-dark.css">
            <script src="highlight.pack.js"></script>
            </head>
            <body>
            <pre><code id="code">${replaced}</code></pre>
            <script>hljs.initHighlightingOnLoad();</script>
            </body>
            </html>`);
            stream.end();
            res.write("http://"+req.headers.host+"/"+fileName);
            if(monitorChannel !== null) monitorChannel.send("```MARKDOWN\n[NEW][PASTE]\n[URL]("+req.body.url+")\n[NEW]("+req.headers.host+"/"+fileName+")\n[IP]("+userIP+")\n```");
            console.log("[NEW][PASTE]\n[URL]("+req.body.url+")\n[NEW]("+req.headers.host+"/"+fileName+")\n[IP]("+userIP+")")
            return res.end();
          });
        });
      });
    };
  };
});
});


// IMAGE UPLOADER
app.post('/api/sharex', (req, res)=>{
  res.setHeader('Content-Type', 'text/text');
  var fileName = randomToken(6);
  var form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    var oldpath = files.fdata.path;
    var newpath = "./uploads/"+fileName+files.fdata.name.toString().match(/(\.)+([a-zA-Z]+)+/g, '').toString();
    var userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    if(fields.key === $con.admin.key){
      if(Math.round((files.fdata.size/1024)/1000) > $con.admin.maxUploadSize){
        if(monitorChannel !== null) monitorChannel.send("```MARKDOWN\n[FAILED UPLOAD][ADMIN]\n[FILE]("+files.fdata.name+")\n[SIZE]("+Math.round(files.fdata.size/1024)+"KB)\n[TYPE]("+files.fdata.type+")\n[IP]("+userIP+")\n\n[ERROR](ERR_FILE_TOO_BIG)```");
          res.write("http://"+req.headers.host+"/"+"ERR_FILE_TOO_BIG"); return res.end();
      }else{
        fs.rename(oldpath, newpath, err => {
          if(monitorChannel !== null) monitorChannel.send("```MARKDOWN\n[NEW UPLOAD][ADMIN]\n[SIZE]("+Math.round(files.fdata.size/1024)+"KB)\n[TYPE]("+files.fdata.type+")\n[IP]("+userIP+")```" + "http://"+req.headers.host+"/"+fileName);
          if (err) return res.write(err);
          res.write("http://"+req.headers.host+"/"+fileName);
          return res.end();
        });
      }
    }else{
      if(Math.round((files.fdata.size/1024)/1000) > $con.maxUploadSize){
        if(monitorChannel !== null) monitorChannel.send("```MARKDOWN\n[FAILED UPLOAD][USER]\n[FILE]("+files.fdata.name+")\n[SIZE]("+Math.round(files.fdata.size/1024)+"KB)\n[TYPE]("+files.fdata.type+")\n[IP]("+userIP+")\n\n[ERROR](ERR_FILE_TOO_BIG)```");
          res.write("http://"+req.headers.host+"/"+"ERR_FILE_TOO_BIG"); return res.end();
      }else{
        if(!$con.allowed.includes(files.fdata.type.toString().toLowerCase().replace(/[A-Za-z]+(\/)+/g,''))){
          if(monitorChannel !== null) monitorChannel.send("```MARKDOWN\n[FAILED UPLOAD][USER]\n[FILE]("+files.fdata.name+")\n[SIZE]("+Math.round(files.fdata.size/1024)+"KB)\n[TYPE]("+files.fdata.type+")\n[IP]("+userIP+")\n\n[ERROR](ERR_ILLEGAL_FILE_TYPE)```");
            res.write("http://"+req.headers.host+"/"+"ERR_ILLEGAL_FILE_TYPE"); return res.end();
        }else{
          fs.rename(oldpath, newpath, err => {
            if(monitorChannel !== null) monitorChannel.send("```MARKDOWN\n[NEW UPLOAD][USER]\n[SIZE]("+Math.round(files.fdata.size/1024)+"KB)\n[TYPE]("+files.fdata.type+")\n[IP]("+userIP+")```" + "http://"+req.headers.host+"/"+fileName);
            if (err) return res.write(err);
            res.write("http://"+req.headers.host+"/"+fileName);
            return res.end();
          });
        }
      }
    }
  });
});

app.listen(80, ()=>{
  console.log('API listening on port 80')
  if($con.discordToken && $con.discordToken !== undefined && $con.discrdToken !== null) {
    client.login($con.discordToken);
  }
});
async function randomToken(number) {
  number = parseInt(number)
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < number; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}