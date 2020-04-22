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

function printResults (body, bot, channelID) {
    var maxNameLength = 0;
    var maxTypeLength = 0;
    body.forEach(result => {
        maxNameLength = Math.max(result.Name.length, maxNameLength);
        maxTypeLength = Math.max(result.Type.length, maxTypeLength);
    });

    var resultString = "```";
    resultString += "".padStart(maxNameLength + 2," ")
        + "CLASS".padStart(maxTypeLength/2 + 2, " ").padEnd(maxTypeLength + 2, " ")
        + " OB PB  lbs DMG\n"
    body.forEach(result => {
        resultString += result.Name.padStart(maxNameLength," ") + " " 
        + ("(" + result.Type + ")").padEnd(maxTypeLength+3," ")  
        + result.OB.padStart(3,' ') + " " + result.PB.padStart(2,' ') + " " 
        + result.Weight.padStart(4," ") + " " + result['Damage Roll'] + "\n"
    });

    resultString += "```";
    bot.sendMessage({
        to: channelID,
        message: resultString
    })
}


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
            case 'stats':
                if (args[0] == 'class') {
                    var url='https://sheetdb.io/api/v1/wddrrdrvt3bll/search?Type=*'+args[1]+'*';
                    console.log(url);
                    request(url, {rejectUnauthorized: false, json: true }, (err, res, body) => {
                        //console.log(body);
                        if (err) { return console.log(err); }
                        if (body.length == 0)
                        {
                            bot.sendMessage({
                                to: channelID,
                                message: 'No results for ' + args.join(' ')
                            });
                            return;
                        }

                        printResults(body, bot, channelID);                        
                    });   
                } else {
                    var url='https://sheetdb.io/api/v1/wddrrdrvt3bll/search?Name=*'+args.join('%20')+'*';
                    console.log(url);
                    request(url, {rejectUnauthorized: false, json: true }, (err, res, body) => {
                        //console.log(body);
                        if (err) { return console.log(err); }
                        if (body.length == 0)
                        {
                            bot.sendMessage({
                                to: channelID,
                                message: 'No results for ' + args.join(' ')
                            });
                            return;
                        }

                        printResults(body, bot, channelID);
                    });              
                }
                break;
            // Just add any case commands if you want to..
         }
     }
});