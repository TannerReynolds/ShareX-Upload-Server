<p align="center">
  <img src="https://qoilo.com/8yh8I9.gif">
</p>

# Nodejs ShareX Server
## Features

- ### Image/Video/General file uploading
- ### Text (With [Syntax Highlighting](https://highlightjs.org/)) [[Example](http://155.138.230.9/SSuaQ)]
- ### URL shortening + a front end for the URL shortener as well [[Example](http://155.138.230.9/short)]
- ### [Markdown rendering](https://github.com/jonschlinkert/remarkable) files [[Example](http://155.138.230.9/5xc9Jk)]
- ### Logging via a Discord channel
- ### Password protected uploading
- ### Server Administration using Discord bot commands
- ### Front end upload page [[Example](http://155.138.230.9/upload)]
- ### Password protected gallery page (password is admin key)

#### [You can demo the features/server here](http://155.138.230.9/)

## Installation (Ubuntu 16.04 Server)
```sh
git clone https://github.com/TannerReynolds/ShareS.git
cd ShareS
chmod +x install.sh
./install.sh
```

## Configuration

In the files you downloaded from this repository, you will see a file called `config.json` 
You must fill this out for the webserver to work properly. Below explains the configuration file and what each part does

```js
{
  "key": "", // Password for private uploading
  "public": false, // Disables auth and does not render a password field for /upload
  "maxUploadSize": 50, // max upload size for non-admins using regular key in MB
  "markdown": true, // enables markdown rendering (upload whole .md file for render)
  "port": 80, // port to listen on
  "secure": true, // Whether or not you want https. (make sure key and cert.pem are in src directory)
  "securePort": 443, // Port to use when secure is true
  "ratelimit": 1000, // Ratelimit for POSTing in milliseconds
  "allowed":[
    "png", "jpg", "gif", "mp4", "mp3", "jpeg", "tiff", "bmp", "ico", "psd", "eps", "raw", "cr2", "nef", "sr2", "orf", "svg", "wav", "webm", "aac", "flac", "ogg", "wma", "m4a", "gifv"
  ], // Allowed file types for non-admins
  "admin":{
    "key": "", // Admin password for uploading & for gallery access
    "maxUploadSize": 1024, // Max upload size for admin in MB
    "allowed": [
    "png", "jpg", "gif", "mp4", "mp3","jpeg", "tiff", "bmp", "ico", "psd", "eps", "raw", "cr2", "nef", "sr2", "orf", "svg", "wav", "webm", "aac", "flac", "ogg", "wma", "m4a", "gifv", "html"
     ] // Allowed file types for admins
  },
  "paste": {
    "maxUploadSize": 20 // allowed paste upload size in MB
  },
  "discordToken": "", // Discord bot token
  "discordAdminIDs": ["discord IDs of people who can run commands go here", "Like this"], // User IDs in an array
  "discordChannelID": "", // Channel ID for monitoring uploads to
  "prefix": "" // Bot Prefix
}
```

## Running The Server
Once you've properly configured your server, you can run `node index.js` in the src folder to start the server.
You can keep your server running forever if you use a process manager, like pm2. pm2 installs along with your server if you used the install.sh script to install your server. Otherwise you can run `npm i -g pm2` to install pm2. Then you can run your server by running `pm2 start index.js`, and monitor logs and such using `pm2 monit`

## Setting up Discord logging
if you wish to log your webserver's activity in a Discord channel for whatever reason, you can.
[Here is information on how to setup a bot account and get the information needed for Discord logging](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token)

## Configuring Your ShareX Client
 - [Download this repository to the PC your ShareX is on](https://github.com/TannerReynolds/ShareX-Custom-Upload-Server/archive/master.zip)
 - Navigate to `Destinations -> Custom Uploader Settings`
 - Import the sxcu files from the downloaded zip one by one `->`
  
  ![Import From File](https://qoilo.com/Ho38au)
  
  ![Importing File](https://qoilo.com/f3BN0R)
  
 - Properly Configure Template `->`
 
 ![template](https://qoilo.com/ZKEdQn)
 
 **Purple**: `http` or `https`. If your server's `secure` setting is set to `true` then use https.
 
 **Green**: Your domain goes here along with any subdomain you may use. Example: `i.qoilo.com`
 
 **Red**: Password goes here. if your `public` setting is set to `true`, dont worry about this.
 
 **Yellow**: Ensure each field is using the correct setting
 
 - Change `Destination Location`

![dest loc](https://qoilo.com/tDFV7n)

### Configuring for Password Protected Uploading
- Add a field to your body called `pupload`, and then make the value whatever you want the password to be
![pupload1](https://qoilo.com/DE0mbH)
- Upload something, and the upload will give you a url to the authentication page
![pupload2](https://qoilo.com/yAORwr)
- Type in your password, and it will display/download the file!

## Credits
#### [Ken](https://github.com/NotWeeb) - Initial File Uploader
#### [Aetheryx](https://github.com/aetheryx) - Webserver Structure
#### [Jaex](https://github.com/Jaex) - ShareX
#### [FancyApps](https://github.com/fancyapps/fancybox) - Gallery lightbox script for displaying images, videos and more


### <a href="https://qoilo.com/hosting"><img src="https://qoilo.com/eWBpJt" width="26px">  Cheap Hosting Options For Your Uploader</a>
