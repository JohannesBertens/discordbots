var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
const request = require('request');

const statsHelpMessage="```" + `
Usage:
.stats help:            Display this message
.stats <keywords>:      Display info on the WEAPONS with the keywords in the name
.stats class <keyword>: Display info the CLASS of WEAPONS with the keyword in the name of the CLASS
.stats eq <keywords>:   Display info on the EQUIPMENT with the keywords in the name
` + "```";
const angrealMessage="```" + `
--- female angreal ---     lbs uses SPpu SPtotal
a disc of moonstone            0.2   10   8     80
a greenish, translucent sphere 1.0   10  10    100
a necklace of fire sapphire    0.1    8   5     40
a sculpted statuette           1.0   20   9    180
a small crystalline circlet    0.2  150   3    450
a wood carving of a bear       3.0    6   5     30
an ivory figurine              1.0    8   4     32
            
 --- male angreal ---      lbs uses SPpu SPtotal
a jade carving of an old man   0.5  50    9    450 
a many-faceted stone	       4.0 142    3    426
a small stone dagger	       ???  30    5    150
a small crystalline globe      0.5  10   10    100
a short, thick rod             2.5  10    6     60
a carved ivory pyramid         ???  15   12    180` + "```";
const pracMessage = 'http://ickmund.github.io/practrainer/';
const eqMessage = 'https://docs.google.com/spreadsheets/d/1F7WvYpa45zZpJhqLeh747CgDtk0LJZg-LRJDXwRf-TU/edit#gid=0';

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

function printResults (body) {
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
    return resultString;
}

function printEqResults (body) {
    var maxNameLength = 0;
    var maxTypeLength = 0;
    body.forEach(result => {
        maxNameLength = Math.max(result.Name.length, maxNameLength);
        maxTypeLength = Math.max(result.Type.length, maxTypeLength);
    });

    var resultString = "```";
    resultString += "".padStart(maxNameLength + 2," ")
        + "CLASS".padStart(maxTypeLength/2 + 2, " ").padEnd(maxTypeLength + 2, " ")
        + " DB PB Total MVs lbs TAbs% EAbs%\n"
    body.forEach(result => {
        resultString += result.Name.padStart(maxNameLength," ") + " " 
        + ("(" + result.Type + ")").padEnd(maxTypeLength+3," ")  
        + result.DB.padStart(3,' ') + " " + result.PB.padStart(2,' ') + " " 
        + result.Total.padStart(4,' ') + " " + result.MV.padStart(3,' ') + " " 
        + result.Weight.padStart(4," ") + " " + result['True Abs %'].padStart(4," ") + " " + result['Est Abs %'].padStart(5," ") + "\n"
    });

    resultString += "```";
    return resultString;
}

function getWikiInfo(searchString, callback) {
    var url='https://wotmud.fandom.com/api/v1/Search/List?query='+searchString+'&limit=1';
    console.log(url);
    request(url, {rejectUnauthorized: false, json: true }, (err, res, body) => {
        if (err) { callback(err); return console.log(err); }
        
        var message = "";
        var links = [];
        if (body != undefined && body.items != undefined) {
            body.items.forEach(item => {
                links.push(item.url);
            });
        }

        if (links.length > 0) {
            message = links.join("\n");
        } else {
            message = 'No results for ' + searchString;
        }
        callback(message);
    });             
}

function getStatsInfo(args, callback) {
    if (args[0] == 'help') {
        callback(statsHelpMessage);
    } else if (args[0] == 'eq') {
        args = args.splice(1);
        var url='https://equipmentstats.azurewebsites.net/api/GetEqStats?name='+args.join('%20');
        console.log(url);
        request(url, {rejectUnauthorized: false, json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            if (body.length == 0)
            {
                callback('No results for ' + args.join(' '));
                return;
            }

            callback(printEqResults(body));
        });
    } else if (args[0] == 'class') {
        var url='https://equipmentstats.azurewebsites.net/api/GetStats?type='+args[1];
        console.log(url);
        request(url, {rejectUnauthorized: false, json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            if (body.length == 0)
            {
                callback('No results for ' + args.join(' '));
                return;
            }

            callback(printResults(body));                   
        }); 
    } else {
        var url='https://equipmentstats.azurewebsites.net/api/GetStats?name='+args.join('%20');
        console.log(url);
        request(url, {rejectUnauthorized: false, json: true }, (err, res, body) => {
            //console.log(body);
            if (err) { return console.log(err); }
            if (body.length == 0)
            {
                callback('No results for ' + args.join(' '));
                return;
            }

            callback(printResults(body));
        });
    };              
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
                bot.sendMessage({to: channelID, message: 'Pong!'});
                break;
            case 'prac':
                bot.sendMessage({to: channelID, message: pracMessage});
                break;
            case 'eq':
                bot.sendMessage({to: channelID, message: eqMessage});
                break;
            case 'wiki':
                getWikiInfo(args.join('%20'), (message) => {
                    bot.sendMessage({to: channelID, message: message});
                });
                break;
            case 'angreal':
                bot.sendMessage({to: channelID, message: angrealMessage});
                break;
            case 'stats':
                getStatsInfo(args, (message) => {
                    bot.sendMessage({to: channelID, message: message})
                });
                break;
            // Just add any case commands if you want to..
         }
     }
});