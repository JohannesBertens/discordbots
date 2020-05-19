var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
const request = require('request');
var moment = require('moment'); // require

const statsHelpMessage="```" + `
Usage:
.stats <keywords>:         WEAPONS with the <keywords> in the name
.stats class <keyword>:    WEAPONS with the <keyword> in the name of the CLASS
.stats eq <keywords>:      EQUIPMENT and TRINKS with the <keywords> in the name
.stats eq class <keyword>: EQUIPMENT and TRINKS with the <keyword> in the name of the CLASS
` + "```";

const auctionHelpMessage="```" + `
Usage:
.auction:                          Lists all running auctions and closed auctions less than 1 day old
.auction bid <auction> <amount>:   Bid on <auction> the <amount> of gc
.auction create <time> <item>:     Create an auction for <item> that will run <time> hours
.auction remove <auction>:         Remove the <auction> if you are the owner
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
a carved ivory pyramid         0.2  15   12    180` + "```";
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
    if (body == undefined || body.length == 0) return "";
    
    var maxNameLength = 0;
    var maxTypeLength = 0;
    body.forEach(result => {
        maxNameLength = Math.max(result.Name.length, maxNameLength);
        maxTypeLength = Math.max(result.Type.length, maxTypeLength);
    });

    var resultString = "```";
    resultString += " EQUIPMENT -- ".padStart(maxNameLength + 2,"-")
        + "CLASS".padStart(maxTypeLength/2 + 2, " ").padEnd(maxTypeLength + 2, " ")
        + " DB  PB Total MVs lbs TAbs% EAbs%\n"
    body.forEach(result => {
        resultString += result.Name.padStart(maxNameLength," ") + " " 
        + ("(" + result.Type + ")").padEnd(maxTypeLength+3," ")  
        + result.DB.padStart(3,' ') + " " + result.PB.padStart(3,' ') + " " 
        + result.Total.padStart(4,' ') + " " + result.MV.padStart(3,' ') + " " 
        + result.Weight.padStart(4," ") + " " + result['True Abs %'].padStart(4," ") + " " + result['Est Abs %'].padStart(5," ") + "\n";
    });

    resultString += "```";
    return resultString;
}

function printTrinkResults (body) {
    if (body == undefined || body.length == 0) return "";

    var maxNameLength = 0;
    var maxTypeLength = 0;
    body.forEach(result => {
        maxNameLength = Math.max(result.Name.length, maxNameLength);
        maxTypeLength = Math.max(result.Type.length, maxTypeLength);
    });

    var resultString = "```";
    resultString += " TRINKS -- ".padStart(maxNameLength + 2,"-")
        + "CLASS".padStart(maxTypeLength/2 + 2, " ").padEnd(maxTypeLength + 2, " ")
        + " DB PB Total MVs lbs\n"
    body.forEach(result => {
        resultString += result.Name.padStart(maxNameLength," ") + " " 
        + ("(" + result.Type + ")").padEnd(maxTypeLength+3," ")  
        + result.DB.padStart(3,' ') + " " + result.PB.padStart(2,' ') + " " 
        + result.Total.padStart(4,' ') + " " + (result.MV ? result.MV.padStart(3,' ') : "".padStart(3, ' ')) + " " 
        + result.Weight.padStart(4," ") + "\n";
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

function postMessage(message, callback) {
    if (message.length > 2000) // DRAMA!
    {
        var lines = message.split("\n");

        var msg1 = (lines.slice(0, lines.length/2)).join("\n") + "```";
        callback(msg1);

        var msg2 = "```" + (lines.slice(lines.length/2)).join("\n");
        setTimeout(function (){
            callback(msg2);
          }, 1000); 
        
    } else {
        callback(message);
    }
}

function getStatsInfo(args, callback) {
    if (args[0] == 'help') {
        callback(statsHelpMessage);
    } else if (args[0] == 'eq') {
        args = args.splice(1);
        
        if (args[0] == 'class') {
            args = args.splice(1);

            var url='https://equipmentstats.azurewebsites.net/api/GetEqStats?type='+args.join('%20');
            console.log(url);
            request(url, {rejectUnauthorized: false, json: true }, (err, res, eqbody) => {
                if (err) { console.log(err); return; }

                var trinkurl='https://equipmentstats.azurewebsites.net/api/GetTrinkStats?type='+args.join('%20');
                console.log(trinkurl);
                request(trinkurl, {rejectUnauthorized: false, json: true }, (err, res, trinkbody) => {
                    if (err) { console.log(err); return; }
                    if (trinkbody.length == 0 && eqbody.length == 0)
                    {
                        callback('No results for ' + args.join(' '));
                        return;
                    }

                    postMessage(printEqResults(eqbody) + printTrinkResults(trinkbody), callback);
                });
            });
        } else {
            var url='https://equipmentstats.azurewebsites.net/api/GetEqStats?name='+args.join('%20');
            console.log(url);
            request(url, {rejectUnauthorized: false, json: true }, (err, res, eqbody) => {
                if (err) { console.log(err); return; }

                var trinkurl='https://equipmentstats.azurewebsites.net/api/GetTrinkStats?name='+args.join('%20');
                console.log(trinkurl);
                request(trinkurl, {rejectUnauthorized: false, json: true }, (err, res, trinkbody) => {
                    if (err) { console.log(err); return; }
                    if (trinkbody.length == 0 && eqbody.length == 0)
                    {
                        callback('No results for ' + args.join(' '));
                        return;
                    }

                    postMessage(printEqResults(eqbody) + printTrinkResults(trinkbody), callback);
                });
            });
        }
    } else if (args[0] == 'class') {
        var url='https://equipmentstats.azurewebsites.net/api/GetStats?type='+args[1];
        console.log(url);
        request(url, {rejectUnauthorized: false, json: true }, (err, res, body) => {
            if (err) { console.log(err); return; }
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
            if (err) { console.log(err); return; }
            if (body.length == 0)
            {
                callback('No results for ' + args.join(' '));
                return;
            }

            callback(printResults(body));
        });
    };              
}

function printAuctions(body) {
    var resultString = "```";
    body.forEach(auction => {
        let endTime = moment(auction.endTime);
        resultString +=  "Auction "+ auction.id + " for " + auction.item + " expires " + endTime.fromNow() + " (" + endTime.toString() + ")\n"; 
    });

    return resultString + "```";
}

function getAuctionInfo(args, callerId, callback) {
    if (args[0] == 'help') {
        callback(auctionHelpMessage);
    } else if (args[0] == 'create') {
        if (args.length < 3) {
            callback("```Need to supply <time> and <item> in the create command, see .auction help```");
            return;
        }

        let timeToRun = Number(args[1]);
        if (Number.isNaN(timeToRun)) {
            callback("```Need to supply a number for <time>, see .auction help```");
            return;
        }

        let item = (args.splice(2)).join(' '); // removed create and time
        // Default: list
        var url='https://wotmudauction.azurewebsites.net/api/CreateAuction?code=uJbW9iCt9p5a/vps16fR5freakBSWlKJybP0sgc1S8bHJ5fVmOBmTg==&seller=' + callerId + '&endtime=' + timeToRun + '&item='+ encodeURI(item);
        request(url, {method: 'post', rejectUnauthorized: false, json: true }, (err, res, body) => {
            if (err) { console.log(err); return; }
            if (res.statusCode != 200){
                callback("Something went wrong: " + res.statusMessage)
            } else {
                callback("<@"+ callerId + "> has created an auction for " + item + " that will run for " + timeToRun + " hours.");
            }
        });
        return;     
    } else {
        // Default: list
        var url='https://wotmudauction.azurewebsites.net/api/GetAuctions?code=maQinmRyoLdFHamUKnzYWoVHadxbaFZYa6dGiRbok514pDu22tqIlg==';
        request(url, {rejectUnauthorized: false, json: true }, (err, res, body) => {
            console.log(body);
            if (err) { console.log(err); return; }
            if (body.length == 0)
            {
                callback('No running auctions.');
                return;
            }

            callback(printAuctions(body));
        });
    }
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
            case 'auction':
                getAuctionInfo(args, userID, (message) => {
                    bot.sendMessage({to: channelID, message: message})
                });
                break;
            // Just add any case commands if you want to..
         }
     }
});