const randomToken = require('random-token');
const express = require('express');
const fs = require('fs');
const app = express();
const bodyParser = require('body-parser');
const path = require("path");
const formidable = require('formidable');
const Discord = require('discord.js');
const client = new Discord.Client();
const $con = require('./config.json');
monitorChannel = null;
// APP SETTINGS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname+"/uploads/", {
  extensions: [ "png", "jpg", "gif", "mp4", "mp3", "txt", "jpeg", "tiff", "bmp", "ico", "psd", "eps", "raw", "cr2", "nef", "sr2", "orf", "svg", "wav", "webm", "aac", "flac", "ogg", "wma", "m4a", "gifv", "html" ],
}));
app.use(express.static(__dirname+"/site_assets/", {
  extensions: [ "png", "jpg", "gif", "mp4", "mp3", "txt", "jpeg", "tiff", "bmp", "ico", "psd", "eps", "raw", "cr2", "nef", "sr2", "orf", "svg", "wav", "webm", "aac", "flac", "ogg", "wma", "m4a", "gifv" ],
}));

// DISCORD BOT SET MONITOR CHANNEL
if($con.discordToken && $con.discordToken !== undefined && $con.discrdToken !== null) {
  client.on('ready', ()=> {
    console.log('Discord API monitor successfully logged in');
    monitorChannel = client.guilds.get($con.discordServerID).channels.get($con.discordChannelID);
  });
}

// URL SHORTENER SERVICE
app.get('/s', (req, res)=>{
  res.setHeader('Content-Type', 'text/html');
  res.write(fs.readFileSync(__dirname+"/pages/short.html"));
  res.end();
});
app.get('/short', (req, res)=>{ res.redirect('/s'); res.end(); });
app.get('/shorten', (req, res)=>{ res.redirect('/s'); res.end(); });

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
app.get('*', function(req, res){
  res.setHeader('Content-Type', 'text/html');
  res.write(fs.readFileSync(__dirname+"/pages/404.html"));
  res.end();
});

// POST REQUESTS
////////////////////////////////////////////
let blackListedNames = [];
// URL SHORTENER
app.post('/shorten', (req, res)=>{
  var fileName = randomToken(6);
  res.setHeader('Content-Type', 'text/text');
  if(req.body.url == undefined || req.body.url == "" || req.body.url == null){
    res.redirect('/s?error=NO_URL_PROVIDED'); return res.end();
  }
  if(!/([-a-zA-Z0-9^\p{L}\p{C}\u00a1-\uffff@:%_\+.~#?&//=]{2,256}){1}(\.[a-z]{2,4}){1}(\:[0-9]*)?(\/[-a-zA-Z0-9\u00a1-\uffff\(\)@:%,_\+.~#?&//=]*)?([-a-zA-Z0-9\(\)@:%,_\+.~#?&//=]*)?/.test(req.body.url.toLowerCase().toString())){
    res.redirect('/s?error=NOT_A_VALID_URL'); return res.end();
  }
  if(req.body.domain == undefined || req.body.domain == "" || req.body.domain == null){
    res.redirect('/s?error=NO_DOMAIN_SELECTED'); return res.end();
  }
  var testRegex = new RegExp(req.body.url.toString().toLowerCase(), "g");
  if(testRegex.test(blackListedNames.toString())){
    res.redirect('/s?error=BLACKLISTED_VALUE_DETECTED'); return res.end();
  }else{
    var stream = fs.createWriteStream(__dirname+"/uploads/s/"+fileName+".html");
    stream.once('open', function (fd) {
      stream.write(`<meta http-equiv="refresh" content="0;URL='${req.body.url}'" />`);
      stream.end();
      monitorChannel.send("```MARKDOWN\n[NEW][SHORT URL]\n[URL]("+req.body.url+")\n[NEW]("+req.body.domain+"/s/"+fileName+")```");
      res.redirect('/s?success=http://'+req.body.domain+"/s/"+fileName);
      return res.end();
    });
  }
});



app.post('/api/shortener', (req, res)=>{
  authorization(req, res);
  var fileName = randomToken(6);
  res.setHeader('Content-Type', 'text/text');
  if(req.body.url == undefined || req.body.url == "" || req.body.url == null){
    res.send('NO_URL_PROVIDED'); return res.end();
  }
  if(!/([-a-zA-Z0-9^\p{L}\p{C}\u00a1-\uffff@:%_\+.~#?&//=]{2,256}){1}(\.[a-z]{2,4}){1}(\:[0-9]*)?(\/[-a-zA-Z0-9\u00a1-\uffff\(\)@:%,_\+.~#?&//=]*)?([-a-zA-Z0-9\(\)@:%,_\+.~#?&//=]*)?/.test(req.body.url.toLowerCase().toString())){
    res.send('NOT_A_VALID_URL'); return res.end();
  }
  if(req.body.domain == undefined || req.body.domain == "" || req.body.domain == null){
    res.send('NO_DOMAIN_SELECTED'); return res.end();
  }
  var testRegex = new RegExp(req.body.url.toString().toLowerCase(), "g");
  if(testRegex.test(blackListedNames.toString())){
    res.send('BLACKLISTED_VALUE_DETECTED'); return res.end();
  }else{
    var stream = fs.createWriteStream(__dirname+"/uploads/s/"+fileName+".html");
    stream.once('open', function (fd) {
      stream.write(`<meta http-equiv="refresh" content="0;URL='${req.body.url}'" />`);
      stream.end();
      monitorChannel.send("```MARKDOWN\n[NEW][SHORT URL]\n[URL]("+req.body.url+")\n[NEW]("+req.body.domain+"/s/"+fileName+")```");
      res.send({ url: `http://${req.body.domain}/s/${fileName}`, file: fileName});
      return res.end();
    });
  }
});


app.post('/api/paste', (req, res)=>{
  authorization(req, res);
  res.setHeader('Content-Type', 'text/text');
  var fileName = randomToken(7);
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    var oldpath = files.fdata.path;
    var newpath = "./uploads/p/"+fileName+files.fdata.name.toString().match(/(\.)+([a-zA-Z]+)+/g, '').toString();
    if(!$con.paste.allowed.includes(files.fdata.name.substring(files.fdata.name.lastIndexOf('.')+1, files.fdata.name.length))){
      res.write("http://"+req.headers.host+"/"+"ERR_ILLEGAL_FILE_TYPE"); return res.end();
    } else {
    if(Math.round((files.fdata.size/1024)/1000) > $con.paste.maxUploadSize){
        monitorChannel.send("```MARKDOWN\n[FAILED PASTE][USER]\n[FILE]("+files.fdata.name+")\n[SIZE]("+Math.round(files.fdata.size/1024)+"KB)\n[TYPE]("+files.fdata.type+")\n[IP]("+userIP+")\n\n[ERROR](ERR_FILE_TOO_BIG)```");
          res.write("http://"+req.headers.host+"/"+"ERR_FILE_TOO_BIG"); return res.end();
      }else{
          fs.rename(oldpath, newpath, function (err) {
          switch (files.fdata.name.substring(files.fdata.name.lastIndexOf('.')+1, files.fdata.name.length)) {
            case "js": return paste("language-js");
            case "txt": return paste("language-none");
            case "lua": return paste("language-lua");
            case "php": return paste("language-php");
            case "html": return paste("language-xml");
            case "json": return paste("language-json");
            case "yml": return paste("language-yaml");
            case "go": return paste("language-go");
            case "cr": return paste("language-crystal");
            case "bat": return paste("language-batch");
            case "css": return paste("language-css");
            case "cs": return paste("language-csharp");
            case "java": return paste("language-java");
            case "py": return paste("language-python");
            case "less": return paste("language-less");
            case "c": return paste("language-c");
            case "cpp": return paste("language-cpp");
            case "ini": return paste("language-ini");
            case "pl": return paste("language-perl");
            case "sql": return paste("language-sql");
            case "rb": return paste("language-ruby");
          }
          function paste(fileType) {
            fs.readFile(newpath, function read(err, data) {
            var stream = fs.createWriteStream(__dirname+"/uploads/p/"+fileName+".html");
            stream.once('open', function (fd) {
              stream.write(`
<!DOCTYPE html>
<html>
<head>
	<link href="prism.css" rel="stylesheet" />
</head>
<body>
  <pre class="line-numbers"><code class="${fileType}"><xmp>${data}</xmp></code></pre>
	<script src="prism.js"></script>
</body>
</html>
              `);
              stream.end();
              fs.unlink(newpath);
              res.write("http://"+req.headers.host+"/p/"+fileName);
              return res.end();
            });
          });
        }
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
  form.parse(req, function (err, fields, files) {
    var oldpath = files.fdata.path;
    var newpath = "./uploads/"+fileName+files.fdata.name.toString().match(/(\.)+([a-zA-Z]+)+/g, '').toString();
    var userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    if(fields.key === $con.admin.key){
      if(Math.round((files.fdata.size/1024)/1000) > $con.admin.maxUploadSize){
        monitorChannel.send("```MARKDOWN\n[FAILED UPLOAD][ADMIN]\n[FILE]("+files.fdata.name+")\n[SIZE]("+Math.round(files.fdata.size/1024)+"KB)\n[TYPE]("+files.fdata.type+")\n[IP]("+userIP+")\n\n[ERROR](ERR_FILE_TOO_BIG)```");
          res.write("http://"+req.headers.host+"/"+"ERR_FILE_TOO_BIG"); return res.end();
      }else{
        fs.rename(oldpath, newpath, function (err) {
          monitorChannel.send("```MARKDOWN\n[NEW UPLOAD][ADMIN]\n[SIZE]("+Math.round(files.fdata.size/1024)+"KB)\n[TYPE]("+files.fdata.type+")\n[IP]("+userIP+")```" + "http://"+req.headers.host+"/"+fileName);
          if (err) return res.write(err);
          res.write("http://"+req.headers.host+"/"+fileName);
          return res.end();
        });
      }
    }else{
      authorization(req, res);
      if(Math.round((files.fdata.size/1024)/1000) > $con.maxUploadSize){
        monitorChannel.send("```MARKDOWN\n[FAILED UPLOAD][USER]\n[FILE]("+files.fdata.name+")\n[SIZE]("+Math.round(files.fdata.size/1024)+"KB)\n[TYPE]("+files.fdata.type+")\n[IP]("+userIP+")\n\n[ERROR](ERR_FILE_TOO_BIG)```");
          res.write("http://"+req.headers.host+"/"+"ERR_FILE_TOO_BIG"); return res.end();
      }else{
        if(!$con.allowed.includes(files.fdata.type.toString().toLowerCase().replace(/[A-Za-z]+(\/)+/g,''))){
          monitorChannel.send("```MARKDOWN\n[FAILED UPLOAD][USER]\n[FILE]("+files.fdata.name+")\n[SIZE]("+Math.round(files.fdata.size/1024)+"KB)\n[TYPE]("+files.fdata.type+")\n[IP]("+userIP+")\n\n[ERROR](ERR_ILLEGAL_FILE_TYPE)```");
            res.write("http://"+req.headers.host+"/"+"ERR_ILLEGAL_FILE_TYPE"); return res.end();
        }else{
          fs.rename(oldpath, newpath, function (err) {
            monitorChannel.send("```MARKDOWN\n[NEW UPLOAD][USER]\n[SIZE]("+Math.round(files.fdata.size/1024)+"KB)\n[TYPE]("+files.fdata.type+")\n[IP]("+userIP+")```" + "http://"+req.headers.host+"/"+fileName);
            if (err) return res.write(err);
            res.write("http://"+req.headers.host+"/"+fileName);
            return res.end();
          });
        }
      }
    }
  });
});

async function authorization(r, p) {
  if (!r.get('Authorization') || !keys.auth.includes(r.get('Authorization'))) { 
    p.status(401).send('Unauthorized'); 
    return p.end()
  }
}

app.listen(80, ()=>{
  console.log('API listening on port 80')
  if($con.discordToken && $con.discordToken !== undefined && $con.discrdToken !== null) {
    client.login($con.discordToken);
  }
});