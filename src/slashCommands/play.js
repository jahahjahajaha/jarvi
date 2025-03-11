const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from YouTube or URL')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name or URL')
                .setRequired(true)),
    async execute(interaction, client) {
        const query = interaction.options.getString('query');

        if (!interaction.member.voice.channel) {
            return await interaction.reply({ 
                content: `${client.emoji.error} You need to be in a voice channel!`,
                ephemeral: true 
            });
        }

        // Defer the reply since searching and loading might take time
        await interaction.deferReply();

        try {
            const res = await client.manager.search(query, interaction.user);
            if (!res.tracks[0]) {
                return await interaction.editReply({ 
                    content: `${client.emoji.error} No results found!`,
                    ephemeral: true 
                });
            }

            const player = client.manager.create({
                guild: interaction.guild.id,
                voiceChannel: interaction.member.voice.channel.id,
                textChannel: interaction.channel.id,
            });

            player.connect();
            player.queue.add(res.tracks[0]);

            if (!player.playing && !player.paused && !player.queue.size) {
                player.play();
            }

            const embed = client.createEmbed(
                null,
                `${client.emoji.success} Added **${res.tracks[0].title}** to the queue!`,
                [
                    { 
                        name: `${client.emoji.time} Duration`,
                        value: res.tracks[0].duration > 0 ? 
                            `\`${Math.floor(res.tracks[0].duration / 60000)}:${((res.tracks[0].duration % 60000) / 1000).toFixed(0).padStart(2, '0')}\`` : 
                            'Live Stream',
                        inline: true
                    },
                    {
                        name: `${client.emoji.music} Requested By`,
                        value: `${interaction.user}`,
                        inline: true
                    }
                ]
            );

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error("Play Command Error:", err);
            await interaction.editReply({ 
                content: `${client.emoji.error} An error occurred while playing the song!`,
                ephemeral: true 
            });
        }
    },
};