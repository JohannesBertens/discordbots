const Discord = require('discord.js');
const client = new Discord.Client();
var logger = require('winston');
var auth = require('./auth.json');
const request = require('request');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

client.on('ready', function (evt) {
    logger.info('Connected');
    logger.info(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '.') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // .ping
            case 'ping':
                msg.channel.send('Pong!');
                break;
            case 'num':
                request('https://writtenrealms.com:9000/api/v1/wot/who/?format=json', {rejectUnauthorized: false, json: true }, (err, res, body) => {
                    if (err) { return console.log(err); }
                    msg.channel.send(body.ls_count + " LS, " + body.ds_count + " DS online.");
                });               
            break;
            // Just add any case commands if you want to..
         }
     }
});

client.login(auth.token)