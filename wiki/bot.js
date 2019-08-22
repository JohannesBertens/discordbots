var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
const request = require('request');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '.') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // .ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
                break;
            case 'prac':
                bot.sendMessage({
                    to: channelID,
                    message: 'http://ickmund.github.io/practrainer/'
                });
                break;
            case 'eq':
                bot.sendMessage({
                    to: channelID,
                    message: 'https://docs.google.com/spreadsheets/d/1F7WvYpa45zZpJhqLeh747CgDtk0LJZg-LRJDXwRf-TU/edit#gid=0'
                });
                break;
            case 'wiki':
                var url='https://wotmud.fandom.com/api/v1/Search/List?query='+args.join('%20')+'&limit=1';
                console.log(url);
                request(url, {rejectUnauthorized: false, json: true }, (err, res, body) => {
                    var links = [];
                    if (body == undefined || body.items == undefined) {
                        bot.sendMessage({
                            to: channelID,
                            message: 'No results for ' + args[0]
                        })
                    } else {
                        body.items.forEach(item => {
                            links.push(item.url);
                        });
                        
                        if (err) { return console.log(err); }
                        if (links.length > 0) {
                            bot.sendMessage({
                                to: channelID,
                                message: links.join("\n")
                            })
                        } else {
                            bot.sendMessage({
                                to: channelID,
                                message: 'No results for ' + args[0]
                            })
                        }
                    }
                });               
                break;
            case 'eq':
                bot.sendMessage({
                    to: channelID,
                    message: "https://docs.google.com/spreadsheets/d/1F7WvYpa45zZpJhqLeh747CgDtk0LJZg-LRJDXwRf-TU/edit#gid=0"
                })
                break;
            case 'stats':
                var url='https://sheetdb.io/api/v1/wddrrdrvt3bll/search?Name=*'+args.join('%20')+'*';
                console.log(url);
                request(url, {rejectUnauthorized: false, json: true }, (err, res, body) => {
                    //console.log(body);
                    if (err) { return console.log(err); }

                    var resultString = "```";
                    body.forEach(result => {
                        resultString += result.Name.padStart(45," ") + " " + ("(" + result.Type + ")").padEnd(15," ") +" OB: " + result.OB.padStart(3,' ') + ", PB: " + result.PB.padStart(2,' ') + ", Weight: " + result.Weight.padStart(4," ") + ", DMG: " + result['Damage Roll'] + "\n"
                    });
                    resultString += "```";
                    bot.sendMessage({
                        to: channelID,
                        message: resultString
                    })

                });              
                break;
            // Just add any case commands if you want to..
         }
     }
});