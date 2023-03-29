const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('num')
		.setDescription('Replies with number of players online 15 min ago!'),
	async execute(interaction) {
        const playerInfo = await fetch('https://writtenrealms.com:9000/api/v1/wot/who/?format=json');
        const playerInfoJson = await playerInfo.json();
        await interaction.reply(`${playerInfoJson.ls_count} LS, ${playerInfoJson.ds_count} DS online (15 min ago)`);
	},
};