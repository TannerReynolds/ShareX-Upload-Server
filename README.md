# Nodejs ShareX API

## Supported Types Of Uploads

- ### Images
- ### Videos
- ### Plain Text
- ### Code (With Syntax Highlighting)
- ### URL Shortening

## Requirements

- ### Nodejs ~8.0.0 (`https://nodejs.org/en/`)

## Configuration

```js
{
  "key": "", <---- password needed for all uploads. Leave blank if you want this to be public
  "host":"",
  "save": "",
  "maxUploadSize": 50, <---- Size in MB
  "allowed":[ <------- supported filetypes
    "png", "jpg", "gif", "mp4", "mp3", "jpeg", "tiff", "bmp", "ico", "psd", "eps", "raw", "cr2", "nef", "sr2", "orf", "svg", "wav", "webm", "aac", "flac", "ogg", "wma", "m4a", "gifv"
  ],
  "admin":{
    "key": "password1234", <----- "Admin" password used for higher upload sizes/more supported file types 
    "save": "",
    "maxUploadSize": 1024, <---- Size in MB
    "allowed": [ <------- supported filetypes
    "png", "jpg", "gif", "mp4", "mp3","jpeg", "tiff", "bmp", "ico", "psd", "eps", "raw", "cr2", "nef", "sr2", "orf", "svg", "wav", "webm", "aac", "flac", "ogg", "wma", "m4a", "gifv"
     ]
  },
  "paste": {
    "maxUploadSize": 20, <---- Size in MB
    "save": "",
    "allowed": [ <------- supported filetypes (all gets converted to an html document)
      "js", "php", "html", "txt", "lua", "json", "yml", "go", "cr", "bat", "css", "cs", "java", "py", "less", "c", "cpp", "ini", "pl", "sql", "rb"
    ]
  },
  "discordToken": "thisismydiscordapitoken", <------ Leave blank if you dont want to monitor uploads/shortened urls through Discord (https://discordapp.com/developers)
  "discordServerID": "111111111111", <---- guild ID that the discordChannelID is in
  "discordChannelID": "2222222222222" <----- channel the API will use to monitor (will send user IP addresses to this channel, along with what they uploaded, filezise, type of user (user/admin), and a link to their upload. For shortened URLS, it will show the URL they shortened)
}
```

## Additional Customization

- ### `/api/paste` uses prism.js & css for syntax highlighting, this can be customized @ `http://prismjs.com/`
