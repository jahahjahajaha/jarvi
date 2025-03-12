const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { convertTime } = require('../utils/convert.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show details about the currently playing song'),
    async execute(interaction, client) {
        const player = client.manager.get(interaction.guild.id);

        if (!player) {
            return await interaction.reply({
                content: `❌ There is no music playing!`,
                ephemeral: true
            });
        }

        const song = player.queue.current;
        if (!song) {
            return await interaction.reply({
                content: `❌ There is no track currently playing!`,
                ephemeral: true
            });
        }

        const songURL = song.uri || `https://www.youtube.com/watch?v=${song.identifier}`;
        const songThumbnail = song.thumbnail || `https://img.youtube.com/vi/${song.identifier}/maxresdefault.jpg`;
        const requester = song.requester;
        const current = player.position;
        const total = song.duration;
        
        // Create a progress bar
        const progressBarLength = 15;
        const progress = Math.floor((current / total) * progressBarLength);
        const progressBar = '▬'.repeat(progress) + '🔘' + '▬'.repeat(progressBarLength - progress);
        
        const timeInfo = `\`${convertTime(current)} / ${convertTime(total)}\``;

        const embed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({ 
                name: "Now Playing", 
                iconURL: "https://i.imgur.com/vCzgsAJ.gif"
            })
            .setTitle(song.title)
            .setURL(songURL)
            .setThumbnail(requester.displayAvatarURL({ dynamic: true }))
            .setImage(songThumbnail)
            .addFields(
                { name: "Progress Bar", value: progressBar, inline: false },
                { name: "Time", value: timeInfo, inline: true },
                { name: "Artist", value: song.author || "Unknown", inline: true },
                { name: "Requested by", value: `${requester.tag || requester.username}`, inline: true },
                { name: "Source", value: song.isStream ? "🔴 LIVE" : (song.uri?.includes("youtube") ? "YouTube" : (song.uri?.includes("spotify") ? "Spotify" : "Unknown")), inline: true },
                { name: "Volume", value: `${player.volume}%`, inline: true },
                { name: "Queue Length", value: `${player.queue.length} song(s)`, inline: true }
            )
            .setFooter({ text: `Use /pause, /resume, or /skip to control playback` })
            .setTimestamp();

        // Create buttons for music controls
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('⏮️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('pause')
                    .setLabel(player.paused ? '▶️' : '⏸️')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('skip')
                    .setLabel('⏭️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('stop')
                    .setLabel('⏹️')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('queue')
                    .setLabel('📋 Queue')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
        
        // Create a button collector to handle button interactions
        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
        
        collector.on('collect', async i => {
            // Make sure the player still exists
            const player = client.manager.get(interaction.guild.id);
            if (!player) {
                await i.reply({ content: "❌ No active player found!", ephemeral: true });
                return collector.stop();
            }
            
            switch (i.customId) {
                case 'previous':
                    // Previous is not directly supported, inform the user
                    await i.reply({ content: "Previous track feature is not supported yet.", ephemeral: true });
                    break;
                case 'pause':
                    if (player.paused) {
                        player.pause(false);
                        await i.reply({ content: "▶️ Resumed playback", ephemeral: true });
                    } else {
                        player.pause(true);
                        await i.reply({ content: "⏸️ Paused playback", ephemeral: true });
                    }
                    break;
                case 'skip':
                    player.stop();
                    await i.reply({ content: "⏭️ Skipped to next song", ephemeral: true });
                    break;
                case 'stop':
                    player.destroy();
                    await i.reply({ content: "⏹️ Stopped playback and cleared queue", ephemeral: true });
                    collector.stop();
                    break;
                case 'queue':
                    // Generate a simple queue embed
                    if (!player.queue.length) {
                        await i.reply({ content: "Queue is empty! Only the current song is playing.", ephemeral: true });
                    } else {
                        const queueEmbed = new EmbedBuilder()
                            .setColor(client.embedColor)
                            .setTitle("Song Queue")
                            .setDescription(
                                player.queue.slice(0, 10).map((track, index) => 
                                    `**${index + 1}.** [${track.title}](${track.uri}) [${convertTime(track.duration)}]`
                                ).join('\n')
                            )
                            .setFooter({ text: `Total songs: ${player.queue.length}` });
                            
                        await i.reply({ embeds: [queueEmbed], ephemeral: true });
                    }
                    break;
            }
        });
        
        collector.on('end', () => {
            // Remove buttons after collector ends
            interaction.editReply({ components: [] }).catch(console.error);
        });
    },
};