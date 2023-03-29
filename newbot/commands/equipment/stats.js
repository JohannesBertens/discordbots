const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Replies with Stats!'),
	async execute(interaction) {
		await interaction.reply('Stats!');
	},
};