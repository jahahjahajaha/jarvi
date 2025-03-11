const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { convertTime } = require('../utils/convert.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show details about the currently playing song'),
    async execute(interaction, client) {
        const player = client.manager.get(interaction.guild.id);

        if (!player) {
            return await interaction.reply({
                content: `${client.emoji.error} There is no music playing!`,
                ephemeral: true
            });
        }

        const song = player.queue.current;
        if (!song) {
            return await interaction.reply({
                content: `${client.emoji.error} There is no track currently playing!`,
                ephemeral: true
            });
        }

        const songURL = song.uri || `https://www.youtube.com/watch?v=${song.identifier}`;
        const songThumbnail = song.thumbnail || `https://img.youtube.com/vi/${song.identifier}/maxresdefault.jpg`;
        const requester = song.requester;
        const current = player.position;
        const total = song.duration;
        const progress = `\`${convertTime(current)} / ${convertTime(total)}\``;

        const embed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({ 
                name: "Now Playing...", 
                iconURL: "https://cdn.discordapp.com/attachments/1288526364286255124/1341867717816352894/8kGd0ZJRhKtrTlPiN0.gif?ex=67b78f32&is=67b63db2&hm=93e864823ae836b9de19144dd01b908bac3548eda447dd6274b3781dee1d1eed&"
            })
            .setTitle(song.title)
            .setURL(songURL)
            .setThumbnail(requester.displayAvatarURL({ dynamic: true }))
            .setImage(songThumbnail)
            .addFields(
                { name: "<a:Progress_gif:1341843608327950411> **Progress**", value: progress, inline: true },
                { name: "🎤 **Artist**", value: song.author || "Unknown", inline: true },
                { name: "⏰ **Requested by**", value: `${requester} | ${requester.globalName || requester.username}`, inline: true },
                { name: "<a:Link:1341469206478061589> **Song Link**", value: `[Click here to listen](${songURL})`, inline: false }
            );

        await interaction.reply({ embeds: [embed] });
    },
};