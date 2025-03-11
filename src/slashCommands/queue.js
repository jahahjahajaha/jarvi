const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the current music queue')
        .addNumberOption(option => 
            option.setName('page')
                .setDescription('Page number of the queue')
                .setRequired(false)),
    async execute(interaction, client) {
        const player = client.manager.get(interaction.guild.id);
        if (!player) {
            return await interaction.reply({
                content: `${client.emoji.error} There is no music playing!`,
                ephemeral: true
            });
        }

        const queue = player.queue;
        const embed = new EmbedBuilder()
            .setColor(client.embedColor);

        // Get total pages
        const multiple = 10;
        const page = interaction.options.getNumber('page') || 1;
        const end = page * multiple;
        const start = end - multiple;

        const tracks = queue.slice(start, end);
        const currentTrack = player.queue.current;

        if (currentTrack) {
            embed.setDescription(`${client.emoji.music} **Current Track**\n` +
                `[${currentTrack.title}](${currentTrack.uri}) [${interaction.guild.members.cache.get(currentTrack.requester.id)}]\n\n` +
                `${client.emoji.queue} **Queue**\n${tracks.map((track, i) => 
                    `\`${start + (++i)}\` [${track.title}](${track.uri}) [${interaction.guild.members.cache.get(track.requester.id)}]`
                ).join('\n')}`)
                .addFields(
                    { 
                        name: `${client.emoji.info} Queue Info`,
                        value: `Total Songs: \`${queue.length}\`\nTotal Length: \`${formatTime(queue.duration)}\`\nRequested by: ${interaction.user}`,
                        inline: true
                    }
                );
        } else {
            embed.setDescription(`${client.emoji.error} There are no tracks in the queue!`);
        }

        const maxPages = Math.ceil(queue.length / multiple);
        if (maxPages > 0) {
            embed.setFooter({ 
                text: `Page ${page > maxPages ? maxPages : page} of ${maxPages}`
            });
        }

        return interaction.reply({ embeds: [embed] });
    }
};

function formatTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor(ms / 60000) % 60;
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}
