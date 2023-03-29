// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./auth.json');

var logger = require('winston');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';


const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	logger.info(`Ready! Logged in as ${c.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);


// client.on('message', msg => {
//     // Our bot needs to know if it will execute a command
//     // It will listen for messages that will start with `!`
//     if (msg.content.substring(0, 1) == '.') {
//         var args = msg.content.substring(1).split(' ');
//         var cmd = args[0];
       
//         args = args.splice(1);
//         switch(cmd) {
//             // .ping
//             case 'ping':
//                 msg.channel.send('Pong!');
//                 break;
//             case 'num':
//                 request('https://writtenrealms.com:9000/api/v1/wot/who/?format=json', {rejectUnauthorized: false, json: true }, (err, res, body) => {
//                     if (err) { return console.log(err); }
//                     msg.channel.send(body.ls_count + " LS, " + body.ds_count + " DS online.");
//                 });               
//             break;
//             // Just add any case commands if you want to..
//          }
//      }
// });

// client.login(auth.token)