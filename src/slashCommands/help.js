const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands'),
    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({ name: `${client.user.username} Help Menu`, iconURL: client.user.displayAvatarURL() })
            .setThumbnail(client.user.displayAvatarURL())
            .addFields([
                { 
                    name: `${client.emoji.music} Music Commands`,
                    value: '`play`, `pause`, `resume`, `stop`, `skip`, `volume`, `nowplaying`, `queue`, `loop`, `shuffle`, `filter`, `seek`, `previous`'
                },
                {
                    name: `${client.emoji.filter} Filter Commands`,
                    value: '`bassboost`, `8d`, `nightcore`, `speed`, `vaporwave`, `distortion`, `equalizer`, `reset`'
                },
                {
                    name: `${client.emoji.info} Information`,
                    value: '`help`, `invite`, `ping`, `status`, `node`, `uptime`'
                },
                {
                    name: `${client.emoji.settings} Settings`,
                    value: '`setprefix`, `24/7`, `autoplay`'
                }
            ])
            .setFooter({ 
                text: `Bot Prefix: ${client.prefix}`
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};