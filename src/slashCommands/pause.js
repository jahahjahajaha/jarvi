const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current song'),
    async execute(interaction, client) {
        const player = client.manager.get(interaction.guild.id);

        if (!player) {
            return await interaction.reply({
                content: `${client.emoji.error} There is no music playing!`,
                ephemeral: true
            });
        }

        if (!interaction.member.voice.channel) {
            return await interaction.reply({
                content: `${client.emoji.error} You need to be in a voice channel!`,
                ephemeral: true
            });
        }

        if (player.paused) {
            return await interaction.reply({
                content: `${client.emoji.error} The music is already paused!`,
                ephemeral: true
            });
        }

        player.pause(true);
        await interaction.reply({
            content: `${client.emoji.pause} Paused the music!`
        });
    },
};