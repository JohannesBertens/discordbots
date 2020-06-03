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
    let currentServer = evt.d.guild_id;
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `.`
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
            case 'ds':
                logger.info(message);
                let dsRole = Object.entries(bot.servers[currentServer].roles).find(r => r[1].name == "DS");
                bot.getMember({"serverID":currentServer,"userID":userID}, function(err, res) {
                    if (err) {
                        console.error(err);
                    } else {
                        if (res.roles.includes(dsRole[0])) {
                            bot.removeFromRole({"serverID":currentServer,"userID":userID,"roleID":dsRole[0]},function(err,response) {
                                if (err) console.error(err); /* Failed to remove role */
                            });
                        } else {
                            bot.addToRole({"serverID":currentServer,"userID":userID,"roleID":dsRole[0]},function(err,response) {
                                if (err) console.error(err); /* Failed to apply role */
                            });        
                        }
                    }
                });
                break;
            case 'ss':
                logger.info(message);
                let ssRole = Object.entries(bot.servers[currentServer].roles).find(r => r[1].name == "SS");
                bot.getMember({"serverID":currentServer,"userID":userID}, function(err, res) {
                    if (err) {
                        console.error(err);
                    } else {
                        if (res.roles.includes(ssRole[0])) {
                            bot.removeFromRole({"serverID":currentServer,"userID":userID,"roleID":ssRole[0]},function(err,response) {
                                if (err) console.error(err); /* Failed to remove role */
                            });
                        } else {
                            bot.addToRole({"serverID":currentServer,"userID":userID,"roleID":ssRole[0]},function(err,response) {
                                if (err) console.error(err); /* Failed to apply role */
                            });        
                        }
                    }
                });
                break;
            case 'mafia':
                logger.info(message);
                let mafiaRole = Object.entries(bot.servers[currentServer].roles).find(r => r[1].name == "mafia");
                bot.getMember({"serverID":currentServer,"userID":userID}, function(err, res) {
                    if (err) {
                        console.error(err);
                    } else {
                        if (res.roles.includes(mafiaRole[0])) {
                            bot.removeFromRole({"serverID":currentServer,"userID":userID,"roleID":mafiaRole[0]},function(err,response) {
                                if (err) console.error(err); /* Failed to remove role */
                            });
                        } else {
                            bot.addToRole({"serverID":currentServer,"userID":userID,"roleID":mafiaRole[0]},function(err,response) {
                                if (err) console.error(err); /* Failed to apply role */
                            });        
                        }
                    }
                });

                break;
            case 'sfw':
                logger.info(message);
                let noSpiceRole = Object.entries(bot.servers[currentServer].roles).find(r => r[1].name == "no spice");
                bot.getMember({"serverID":currentServer,"userID":userID}, function(err, res) {
                    if (err) {
                        console.error(err);
                    } else {
                        if (res.roles.includes(noSpiceRole[0])) {
                            bot.removeFromRole({"serverID":currentServer,"userID":userID,"roleID":noSpiceRole[0]},function(err,response) {
                                if (err) console.error(err); /* Failed to remove role */
                            });
                        } else {
                            bot.addToRole({"serverID":currentServer,"userID":userID,"roleID":noSpiceRole[0]},function(err,response) {
                                if (err) console.error(err); /* Failed to apply role */
                            });        
                        }
                    }
                });

                break;
            break;
            // Just add any case commands if you want to..
         }
     }
});